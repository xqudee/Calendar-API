import prisma from "../db/index.js";
// import moment from "moment";
// import jwt from "jsonwebtoken";
// import { sendEmail } from "../tools/sendEmail.js";
// import { addToCalendarHTML } from "../public/emails/addToCalendarHTML.js";

export const getCalendarById = async (req, res) => {
  const calendarId = req.params.calendarId;
  const calendar = await prisma.calendar.findUnique({
    where: { id: calendarId },
  });

  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found." });
  }

  return res.status(200).json(calendar);
};

export const createCalendar = async (req, res) => {
    const { name, description, userId } = req.body;
  
    const calendar = await prisma.calendar.create({
      data: {
        name,
        description,
      },
    });
  
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
  
    await prisma.userCalendars.create({
      data: {
        userId: user.id,
        calendarId: calendar.id,
        role: "ADMIN",
        isConfirmed: true,
      },
    });
  
    return res.status(200).json(calendar);
};