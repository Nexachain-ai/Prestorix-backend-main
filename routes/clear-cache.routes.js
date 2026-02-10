const router = require("express").Router();


router.get("/clear-cache", (req, res) => {
    const io = req.app.get("io");
    io.emit("clearCache");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("Set-Cookie", "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure");
    res.json({ success: true, message: "Cache clear signal sent to all clients!" });
});

module.exports = router;