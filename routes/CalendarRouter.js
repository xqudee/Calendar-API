import { Router } from "express";
import {
  getAllUserCalendars,
//   getAllCalendarEvents,
//   confirmAddingToCalendar,
  createCalendar,
//   addUserToCalendar,
  updateCalendar,
  deleteCalendar,
  getCalendarById,
  getCalendarByName,
//   getCalendarEventsByTime,
//   getCalendarByEvent,
} from "../controllers/CalendarController.js";
import { isAuth } from "../middleware/isAuth.js";

const router = Router();

router.get("/:calendarId", getCalendarById);
router.get("/allUserCalendars/:id", getAllUserCalendars);
router.get("/name/:calendarName", getCalendarByName);
// router.get("/calendarByEvent/:eventId", getCalendarByEvent);
// router.get("/allEvents/:id", getAllCalendarEvents);
// router.get("/getEventsByTime/:id", getCalendarEventsByTime);
// router.get("/addUserToCalendar/:id/:token", confirmAddingToCalendar);
router.post("/", isAuth, createCalendar);
// router.post("/addUserToCalendar", isAuth, addUserToCalendar);
router.patch("/:id", isAuth, updateCalendar);
router.delete("/:id", isAuth, deleteCalendar);

export default router;
