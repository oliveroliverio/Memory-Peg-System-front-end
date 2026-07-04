'use strict';

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { isSupported } = require('./mediaTypes');

/**
 * Storage provider abstraction.
 *
 * The current implementation targets the local Raspberry Pi DataLake. Future
 * providers (Synology, Google Drive, S3, Dropbox, …) can implement this same
 * shape behind the index without touching the API or frontend:
 *
 *   scan()               -> Promise<Array<AssetSource>>
 *   watch(handlers)      -> function close()   (live change notifications)
 *   mediaBasePath()      -> string | null      (dir for express.static, if local)
 *
 * where AssetSource = { absolutePath, relativePath, stats }
 */
class StorageProvider {
    /* eslint-disable no-unused-vars, class-methods-use-this */
    async scan() { throw new Error('not implemented'); }
    watch(handlers) { throw new Error('not implemented'); }
    mediaBasePath() { return null; }
    /* eslint-enable */
}

/**
 * Local filesystem DataLake provider rooted at a directory (default: the
 * canonical /home/olivero54/DATALAKE). Recurses into subfolders (images/,
 * videos/, text/, …) as well as a flat layout.
 */
class LocalDataLakeProvider extends StorageProvider {
    constructor(root) {
        super();
        this.root = path.resolve(root);
    }

    mediaBasePath() {
        return this.root;
    }

    /** Recursively collect supported media files under the root. */
    async scan() {
        const results = [];
        const walk = async (dir) => {
            let entries;
            try {
                entries = await fs.promises.readdir(dir, { withFileTypes: true });
            } catch (err) {
                if (err.code === 'ENOENT') return; // root or subdir vanished — skip
                throw err;
            }
            for (const entry of entries) {
                const abs = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await walk(abs);
                } else if (entry.isFile() && isSupported(entry.name)) {
                    try {
                        const stats = await fs.promises.stat(abs);
                        results.push(this._toSource(abs, stats));
                    } catch (err) {
                        if (err.code !== 'ENOENT') throw err; // race with deletion
                    }
                }
            }
        };
        await walk(this.root);
        return results;
    }

    /**
     * Watch the DataLake for add/change/unlink events.
     * @param {{ onAdd: fn, onChange: fn, onRemove: fn, onReady?: fn }} handlers
     *   onAdd/onChange receive an AssetSource; onRemove receives { absolutePath, relativePath }.
     * @returns {() => Promise<void>} close function.
     */
    watch(handlers) {
        const watcher = chokidar.watch(this.root, {
            ignoreInitial: true,           // initial scan() handles existing files
            awaitWriteFinish: {            // wait for captures to finish writing
                stabilityThreshold: 400,
                pollInterval: 100,
            },
            depth: 10,
        });

        const emit = async (abs, cb) => {
            if (!isSupported(abs)) return;
            try {
                const stats = await fs.promises.stat(abs);
                cb(this._toSource(abs, stats));
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }
        };

        watcher
            .on('add', (abs) => emit(abs, handlers.onAdd))
            .on('change', (abs) => emit(abs, handlers.onChange))
            .on('unlink', (abs) => {
                if (!isSupported(abs)) return;
                handlers.onRemove({ absolutePath: abs, relativePath: this._rel(abs) });
            })
            .on('error', (err) => console.error('[DataLake watcher] error:', err.message));

        if (handlers.onReady) watcher.on('ready', handlers.onReady);

        return () => watcher.close();
    }

    _rel(abs) {
        return path.relative(this.root, abs).split(path.sep).join('/');
    }

    _toSource(abs, stats) {
        return { absolutePath: abs, relativePath: this._rel(abs), stats };
    }
}

module.exports = { StorageProvider, LocalDataLakeProvider };
