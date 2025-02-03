  deno compile -A \
    --include=modules/server/out-worker.ts \
    --include=modules/server/in-worker.ts \
    --include=modules/watch-file-worker.ts \
    --include *.ts \
    -o watcher_client \
    main.ts
