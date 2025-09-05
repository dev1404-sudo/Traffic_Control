    import express from "express";
    import { protect } from "../middlewares/authMiddleware.js";
    import { isAdmin } from "../middlewares/admiMiddleware.js";
    import { addToll, updateToll, deleteToll, getTollsAlongRoute, getSpecificTollDetails } from "../controllers/toll.controller.js";
    const router = express.Router();

    /* ADMIN ROUTES */
    router.post("/add-toll", protect, isAdmin, addToll);
    router.put("/update-toll/:tollId", protect, isAdmin, updateToll);
    router.delete("/delete-toll/:tollId", protect, isAdmin, deleteToll);

    /* USER ROUTES */
    router.get("/get-tolls", protect, getTollsAlongRoute);
    router.get("/get-toll/:tollId", protect, getSpecificTollDetails);

    export { router as tollRouter };