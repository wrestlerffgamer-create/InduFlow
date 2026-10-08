const stageService = require("../services/stageService");

exports.completeStage = async (req, res) => {
  const { orderId, departmentId } = req.body;

  if (!orderId || !departmentId) {
    return res.status(400).send("Missing fields");
  }

  try {
    await stageService.completeStage(orderId, departmentId);
    res.send("Stage completed and next started");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating stage");
  }
};
