  deno compile -A \
    --include=modules/server/out-worker.ts \
    --include=modules/server/in-worker.ts \
    --include=modules/watch-file-worker.ts \
    --include *.ts \
    -o watcher_client \
    --target x86_64-pc-windows-msvc \
    main.ts
