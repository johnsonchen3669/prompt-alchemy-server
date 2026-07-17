/**
 * 確認服務正常
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };
