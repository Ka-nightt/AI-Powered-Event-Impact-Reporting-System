const sdgService = require('../services/sdgService');

async function listSdgGoals(req, res, next) {
  try {
    const goals = await sdgService.listSdgGoals();
    res.json(goals);
  } catch (err) {
    next(err);
  }
}

module.exports = { listSdgGoals };
