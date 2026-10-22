// Controllers entry point
export const healthController = (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
};
