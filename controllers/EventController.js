import prisma from "../db/index.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../tools/sendEmail.js";
import cron from "node-cron";
import moment from "moment";
import { reminderHTML } from "../public/";
import { birthdayHTML } from "../public/emails/birthdayHTML.js";
import { addToEventHTML } from "../public/emails/addToEventHTML.js";

export const getAllEvents = async (req, res) => {
  const events = await prisma.event.findMany();

  return res.status(200).json(events);
};

export const getEventById = async (req, res) => {
  const eventId = req.params.eventId;
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  return res.status(200).json(event);
};

export const getUserEvents = async (req, res) => {
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const events = await prisma.userEvents.findMany({
    where: {
      userId: userId,
      isConfirmed: true,
    },
    select: {
      event: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.status(200).json(events);
};

export const createEvent = async (req, res) => {
  const {
    name,
    color,
    content,
    start,
    end,
    type,
    userId,
    calendarId,
    remindDelay,
  } = req.body;

  const calendar = await prisma.calendar.findUnique({
    where: {
      id: calendarId,
    },
  });

  if (!calendar) {
    return res.status(404).json({ message: "Calendar not found." });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const userCalendar = await prisma.userCalendars.findFirst({
    where: {
      userId: userId,
      calendarId: calendarId,
    },
  });

  if (!userCalendar) {
    return res.status(404).json({ message: "User is not in the calendar." });
  }

  if (userCalendar.role === "GUEST") {
    return res
      .status(403)
      .json({ message: "User is not allowed to add events." });
  }

  let startDate;
  let endDate;

  if (type === "BIRTHDAY") {
    startDate = moment(start).startOf("day");
    endDate = moment(start).endOf("day");
  }

  const event = await prisma.event.create({
    data: {
      name,
      color,
      content,
      start: startDate || start,
      end: endDate || end,
      type,
    },
  });

  const calendarEvent = await prisma.calendarEvents.create({
    data: {
      calendarId,
      eventId: event.id,
    },
  });

  const userEvent = await prisma.userEvents.create({
    data: {
      role: userCalendar.role,
      userId,
      eventId: event.id,
    },
  });

  if (type === "REMINDER") {
    const delay = remindDelay || "15 minutes";
    const delayArray = delay.split(" ");

    const scheduledTime = moment(start)
      .subtract(parseInt(delayArray[0]), delayArray[1])
      .format();
    const reminderDate = new Date(
      moment(scheduledTime).utc().format("YYYY-MM-DDTHH:mm:ss")
    );

    const month = reminderDate.getMonth() + 1;
    const day = reminderDate.getDate();
    const hour = reminderDate.getHours();
    const minute = reminderDate.getUTCMinutes();

    const cronExpression = `${minute} ${hour} ${day} ${month} *`;

    cron.schedule(cronExpression, async () => {
      await sendEmail(
        user.email,
        `🔔 ${name} reminder 🔔`,
        reminderHTML(
          user.full_name,
          name,
          content,
          moment(start).utc().format("DD.MM.YYYY [at] HH:mm"),
          "google.com"
        )
      );
      cron.cancel(cronExpression);
    });
  }

  if (type === "BIRTHDAY") {
    const scheduledTime = moment(start).format();
    const reminderDate = moment(scheduledTime).toDate();

    const month = reminderDate.getMonth() + 1;
    const day = reminderDate.getDate();

    const cronExpression = `0 9 ${day} ${month} *`;

    cron.schedule(cronExpression, async () => {
      await sendEmail(
        user.email,
        `🎂 ${name} Birthday 🎂`,
        birthdayHTML(user.full_name, name)
      );
      cron.cancel(cronExpression);
    });
  }

  return res.status(201).json({ event, userEvent, calendarEvent });
};

export const updateEvent = async (req, res) => {
  const eventId = req.params.id;
  const { name, color, content, start, end, type, calendarId } = req.body;
  const event = await prisma.event.update({
    where: {
      id: eventId,
    },
    data: {
      name,
      color,
      content,
      start,
      end,
      type,
    },
  });

  await prisma.calendarEvents.updateMany({
    where: {
      eventId: eventId,
    },
    data: {
      calendarId: calendarId,
    },
  });

  return res.status(200).json({ event: event, calendarId: calendarId });
};

export const deleteEvent = async (req, res) => {
  const eventId = req.params.id;

  const event = await prisma.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    return res.status(404).json({ message: "Event not found." });
  }

  await prisma.userEvents.deleteMany({
    where: {
      eventId: eventId,
    },
  });

  await prisma.calendarEvents.deleteMany({
    where: {
      eventId: eventId,
    },
  });

  await prisma.event.delete({
    where: {
      id: eventId,
    },
  });

  return res.status(200).json({ message: "Event deleted." });
};
