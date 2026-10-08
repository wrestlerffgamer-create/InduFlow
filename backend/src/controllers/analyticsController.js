const analyticsService = require("../services/analyticsService");

exports.getDashboard = async (req, res) => {
  try {
    const departmentId = req.user.role === "ceo" ? null : req.user.departmentId;
    const orderStats = await analyticsService.getOrderStats(departmentId);
    const delayStats = await analyticsService.getDelaysByDept(departmentId);
    const workflowStats = await analyticsService.getWorkflowStats(departmentId);
    const orders = await analyticsService.getOrderProgress(departmentId);

    res.json({
      orderStats,
      delayStats,
      workflowStats,
      orders,
    });
  } catch (err) {
    res.status(500).send("Error fetching analytics");
  }
};
