// 必須在載入 repository/db 之前設定，讓 env.js 讀取 .env.production。
process.env.NODE_ENV = 'production';

const favoriteRepository = require(
    '../database/repositories/favorite.repository'
);

async function main() {
    const userId = process.argv[2];

    if (!userId) {
        throw new Error(
            '請提供 userId，例如：node src/tests/read-favorites.js <userId>'
        );
    }

    console.log('正在從正式資料庫讀取收藏（僅執行 SELECT）...');

    const favorites =
        await favoriteRepository.findByUserId(userId);

    console.log(`userId：${userId}`);
    console.log(`收藏數量：${favorites.length}`);
    console.table(favorites);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('讀取收藏失敗：', error);
        process.exit(1);
    });
