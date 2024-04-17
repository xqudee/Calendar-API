import prisma from "../db/index.js";
// import moment from "moment";
// import jwt from "jsonwebtoken";
// import { sendEmail } from "../tools/sendEmail.js";
// import { addToCalendarHTML } from "../public/emails/addToCalendarHTML.js";

export const getAllUserCalendars = async (req, res) => {
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const calendars = await prisma.userCalendars.findMany({
    where: {
      userId: userId,
      isConfirmed: true,
    },
    select: {
      calendar: true,
    },
  });

  return res.status(200).json(calendars);
};

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

export const getCalendarByName = async (req, res) => {
    const calendarName = req.params.calendarName;
    const calendar = await prisma.calendar.findUnique({
      where: { name: calendarName },
    });
  
    if (!calendar) {
      return res.status(404).json({ message: "Calendar not found." });
    }
  
    return res.status(200).json(calendar);
}

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

export const updateCalendar = async (req, res) => {
  const calendarId = req.params.id;
  const { name, color, description } = req.body;

  const calendar = await prisma.calendar.update({
    where: {
      id: calendarId,
    },
    data: {
      name,
      color,
      description,
    },
  });

  return res.status(200).json(calendar);
};

export const deleteCalendar = async (req, res) => {
  const calendarId = req.params.id;

  const calendar = await prisma.calendar.findUnique({
    where: {
      id: calendarId,
    },
  });

  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found." });
  }

  if (calendar.isMain) {
    return res.status(400).json({ message: "Cannot delete main calendar." });
  }

  await prisma.userCalendars.deleteMany({
    where: {
      calendarId: calendarId,
    },
  });

  await prisma.calendarEvents.deleteMany({
    where: {
      calendarId: calendarId,
    },
  });

  await prisma.calendar.delete({
    where: {
      id: calendarId,
    },
  });

  return res.status(200).json({ message: "Calendar deleted." });
};
