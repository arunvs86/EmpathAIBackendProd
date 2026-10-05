import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveTherapistLocale, emailCopy, copyFor, fallbackNamesFor } from "../services/email/emailCopy.js";

const sentMail = [];
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: vi.fn(async (opts) => {
        sentMail.push(opts);
        return { messageId: "x" };
      }),
    }),
  },
}));

const { default: emailService } = await import("../services/email/emailService.js");

const appointment = { id: "a1", scheduled_at: new Date("2026-07-28T08:00:00Z"), session_duration: 50 };
const client = { username: "Ana", email: "ana@example.com" };
const therapist = { username: "Belén", email: "belen@example.com" };

beforeEach(() => {
  sentMail.length = 0;
});

describe("resolveTherapistLocale", () => {
  it("returns es when the therapist practises in Spanish", () => {
    expect(resolveTherapistLocale(["Spanish"])).toBe("es");
  });

  it("matches Spanish however it is spelled", () => {
    expect(resolveTherapistLocale(["spanish"])).toBe("es");
    expect(resolveTherapistLocale(["Español"])).toBe("es");
    expect(resolveTherapistLocale(["espanol"])).toBe("es");
  });

  it("returns es when Spanish is one of several languages", () => {
    expect(resolveTherapistLocale(["English", "Spanish"])).toBe("es");
  });

  it("returns en for English-only therapists", () => {
    expect(resolveTherapistLocale(["English"])).toBe("en");
  });

  it("returns en for missing or malformed data", () => {
    expect(resolveTherapistLocale(null)).toBe("en");
    expect(resolveTherapistLocale(undefined)).toBe("en");
    expect(resolveTherapistLocale([])).toBe("en");
    expect(resolveTherapistLocale([null])).toBe("en");
    expect(resolveTherapistLocale("English")).toBe("en");
  });

  it("accepts a bare string of Spanish", () => {
    expect(resolveTherapistLocale("Spanish")).toBe("es");
  });

  it("does not match an unrelated language", () => {
    expect(resolveTherapistLocale(["French", "German"])).toBe("en");
  });
});

describe("email copy completeness", () => {
  const keys = Object.keys(emailCopy.en);

  it("has a Spanish version of every English template", () => {
    expect(Object.keys(emailCopy.es).sort()).toEqual(keys.sort());
  });

  // Guards against a template being copied over but left in English.
  it.each(Object.keys(emailCopy.en))("%s differs between en and es", (key) => {
    const params = {
      clientName: "Ana",
      therapistName: "Belén",
      when: "28 Jul 2026, 09:00 BST",
      link: "https://example.com/join",
      altLines: "• 29 Jul 2026, 09:00 BST",
      action: "cancel_and_delete",
      date: "2026-07-28",
      slot: "09:00-09:50",
      cancelled: 1,
      proposed: 0,
      rejected: 0,
    };
    const en = emailCopy.en[key](params);
    const es = emailCopy.es[key](params);

    expect(es.subject).not.toBe(en.subject);
    expect(es.text).not.toBe(en.text);
  });

  it("keeps the recipient's name in the Spanish copy", () => {
    const es = emailCopy.es.requestTherapist({ clientName: "Ana", therapistName: "Belén", when: "x" });
    expect(es.text).toContain("Belén");
    expect(es.text).toContain("Ana");
  });

  it("falls back to English for an unknown locale", () => {
    expect(copyFor("fr")).toBe(emailCopy.en);
    expect(copyFor(undefined)).toBe(emailCopy.en);
  });

  it("localises the stand-in names", () => {
    expect(fallbackNamesFor("es").therapist).toBe("tu terapeuta");
    expect(fallbackNamesFor("en").therapist).toBe("your therapist");
    expect(fallbackNamesFor("fr").therapist).toBe("your therapist");
  });
});

describe("sendAppointmentRequestEmail", () => {
  // The reported bug: a Spanish therapist received the request in English.
  it("writes the therapist's copy in Spanish", async () => {
    await emailService.sendAppointmentRequestEmail(appointment, client, therapist, "es");

    const pro = sentMail.find((m) => m.to === therapist.email);
    expect(pro.subject).toBe("Nueva solicitud de cita en EmpathAI");
    expect(pro.text).toContain("Hola Belén");
    expect(pro.text).toContain("nueva solicitud de cita");
    expect(pro.text).not.toMatch(/Hello|appointment request/);
  });

  it("writes the client's copy in Spanish too", async () => {
    await emailService.sendAppointmentRequestEmail(appointment, client, therapist, "es");

    const cli = sentMail.find((m) => m.to === client.email);
    expect(cli.subject).toBe("Tu solicitud de cita en EmpathAI ha sido enviada");
    expect(cli.text).toContain("Hola Ana");
  });

  it("still sends English for an English therapist", async () => {
    await emailService.sendAppointmentRequestEmail(appointment, client, therapist, "en");

    const pro = sentMail.find((m) => m.to === therapist.email);
    expect(pro.subject).toBe("New Appointment Request on EmpathAI");
    expect(pro.text).toContain("Hello Belén");
  });

  it("defaults to English when no locale is given", async () => {
    await emailService.sendAppointmentRequestEmail(appointment, client, therapist);

    expect(sentMail.find((m) => m.to === therapist.email).subject).toBe(
      "New Appointment Request on EmpathAI"
    );
  });

  it("emails both parties", async () => {
    await emailService.sendAppointmentRequestEmail(appointment, client, therapist, "es");
    expect(sentMail.map((m) => m.to).sort()).toEqual([client.email, therapist.email].sort());
  });
});

describe("the other appointment emails honour the locale", () => {
  it("confirmation, in Spanish, with the join links", async () => {
    await emailService.sendAppointmentConfirmationEmail(
      appointment,
      client,
      therapist,
      { clientLink: "https://meet/c", proLink: "https://meet/p" },
      "es"
    );

    const cli = sentMail.find((m) => m.to === client.email);
    const pro = sentMail.find((m) => m.to === therapist.email);
    expect(cli.subject).toBe("Tu cita en EmpathAI está confirmada");
    expect(cli.text).toContain("https://meet/c");
    expect(pro.subject).toBe("Nueva cita reservada en EmpathAI");
    expect(pro.text).toContain("https://meet/p");
  });

  it("confirmation in Spanish without a link", async () => {
    await emailService.sendAppointmentConfirmationEmail(appointment, client, therapist, {}, "es");

    const cli = sentMail.find((m) => m.to === client.email);
    expect(cli.text).toContain("Te enviaremos el enlace");
    expect(cli.text).not.toMatch(/We will send you/);
  });

  it("slot taken, in Spanish", async () => {
    await emailService.sendSlotTakenEmail(appointment, client, therapist, "es");
    expect(sentMail[0].subject).toBe("Horario de cita ya ocupado - EmpathAI");
  });

  it("rejection, in Spanish", async () => {
    await emailService.sendRejectionEmail(appointment, client, therapist, "es");
    expect(sentMail[0].subject).toBe("Cita rechazada - EmpathAI");
  });

  it("therapist cancellation, in Spanish", async () => {
    await emailService.sendTherapistCancelledAppointmentEmail(appointment, client, therapist, "es");
    expect(sentMail[0].subject).toBe("Tu sesión en EmpathAI ha sido cancelada");
  });

  it("proposed reschedule, in Spanish, listing the alternatives", async () => {
    await emailService.sendTherapistProposedRescheduleEmail(
      appointment,
      client,
      therapist,
      ["2026-07-29T08:00:00Z"],
      "es"
    );

    expect(sentMail[0].subject).toBe("Tu terapeuta ha propuesto un nuevo horario");
    expect(sentMail[0].text).toContain("29 Jul 2026");
  });

  it("pending rejected, in Spanish", async () => {
    await emailService.sendPendingRequestRejectedEmail(appointment, client, therapist, "es");
    expect(sentMail[0].subject).toBe("No se ha podido aceptar tu solicitud");
  });

  it("availability summary, in Spanish", async () => {
    await emailService.sendTherapistAvailabilityChangeSummary(
      therapist,
      { action: "cancel_and_delete", date: "2026-07-28", slot: "09:00-09:50", affectedCounts: { cancelled: 2 } },
      "es"
    );

    expect(sentMail[0].subject).toContain("Cambio de disponibilidad procesado");
    expect(sentMail[0].text).toContain("Clientes afectados");
    expect(sentMail[0].text).toContain("• Cancelados: 2");
  });

  it("uses the Spanish stand-in when the therapist has no username", async () => {
    await emailService.sendTherapistCancelledAppointmentEmail(appointment, client, {}, "es");
    expect(sentMail[0].text).toContain("tu terapeuta");
    expect(sentMail[0].text).not.toContain("your therapist");
  });
});
