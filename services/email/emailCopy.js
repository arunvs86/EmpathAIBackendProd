// Appointment email copy per locale.
//
// There is no stored language preference on Users, so the locale for an
// appointment's emails is derived from the therapist's languages_spoken.

const SPANISH = /espa(ñ|n)ol|spanish/i;

/** "es" when the therapist practises in Spanish, otherwise "en". */
export function resolveTherapistLocale(languagesSpoken) {
  const list = Array.isArray(languagesSpoken) ? languagesSpoken : [languagesSpoken];
  return list.some((l) => SPANISH.test(String(l ?? ""))) ? "es" : "en";
}

export const emailCopy = {
  en: {
    requestClient: ({ clientName, therapistName, when }) => ({
      subject: "Your EmpathAI Appointment Request Has Been Sent",
      text: `Hello ${clientName},

Your request to meet ${therapistName} has been submitted for ${when} (UK time).

The therapist will review and confirm. You'll get a separate email once it's approved and scheduled.

Thank you for choosing EmpathAI.

Warm regards,
The EmpathAI Team`,
    }),

    requestTherapist: ({ clientName, therapistName, when }) => ({
      subject: "New Appointment Request on EmpathAI",
      text: `Hello ${therapistName},

You have a new appointment request from ${clientName} for ${when} (UK time).

Please review and confirm the booking.

Best regards,
The EmpathAI Team`,
    }),

    confirmationClient: ({ clientName, therapistName, when, link }) => ({
      subject: "Your EmpathAI Appointment is Confirmed",
      text: `Hello ${clientName},

Your appointment with ${therapistName} is confirmed for ${when}.

${link ? `Join your session here:\n${link}\n` : `We will send you the session link before your appointment.\n`}

Thank you for choosing EmpathAI.

Warm regards,
The EmpathAI Team`,
    }),

    confirmationTherapist: ({ clientName, therapistName, when, link }) => ({
      subject: "New EmpathAI Appointment Booked",
      text: `Hello ${therapistName},

You have a new appointment with ${clientName} on ${when}.

${link ? `Join your session here:\n${link}\n` : `No session link generated yet. Please check your dashboard.\n`}

Please note that all appointments are based on the UK time zone.

The EmpathAI Team`,
    }),

    slotTaken: ({ clientName, therapistName }) => ({
      subject: "Appointment Slot taken - EmpathAI",
      text: `Hello ${clientName},

Your appointment with ${therapistName} has been taken by someone else in the queue.

Thank you for choosing EmpathAI.

Best regards,
EmpathAI Team`,
    }),

    rejection: ({ clientName, therapistName }) => ({
      subject: "Appointment denied - EmpathAI",
      text: `Hello ${clientName},

Your appointment with ${therapistName} has been cancelled due to scheduling reasons.

Thank you for choosing EmpathAI.

Best regards,
EmpathAI Team`,
    }),

    therapistCancelled: ({ clientName, therapistName, when }) => ({
      subject: "Your EmpathAI session was cancelled",
      text: `Hello ${clientName},

Your appointment with ${therapistName} on ${when} was cancelled because the therapist updated their schedule.

You can book a new time in the app whenever you're ready.

— EmpathAI`,
    }),

    proposedReschedule: ({ clientName, therapistName, when, altLines }) => ({
      subject: "Your therapist proposed a new time",
      text: `Hello ${clientName},

Your appointment with ${therapistName} (previously ${when}) needs to be moved.
They've proposed the following alternative time(s):

${altLines || "• (Open the app to choose a new time)"}

Please open EmpathAI to accept one of the options or pick a different slot.

— EmpathAI`,
    }),

    pendingRejected: ({ clientName, therapistName, when }) => ({
      subject: "Your request couldn’t be accepted",
      text: `Hello ${clientName},

Your pending appointment request with ${therapistName} for ${when} couldn’t be accepted because the therapist updated their availability.

Please open EmpathAI to request a different time.

— EmpathAI`,
    }),

    availabilitySummary: ({ therapistName, action, date, slot, cancelled, proposed, rejected }) => ({
      subject: `Availability change processed: ${action}`,
      text: `Hello ${therapistName},

Your availability change has been applied:
• Action: ${action}
• Date/Slot: ${date || "-"} ${slot ? `(${slot})` : ""}

Affected clients:
• Cancelled: ${cancelled}
• Proposed reschedule: ${proposed}
• Auto-rejected (pending): ${rejected}

— EmpathAI`,
    }),
  },

  es: {
    requestClient: ({ clientName, therapistName, when }) => ({
      subject: "Tu solicitud de cita en EmpathAI ha sido enviada",
      text: `Hola ${clientName}:

Tu solicitud para reunirte con ${therapistName} se ha enviado para el ${when} (hora del Reino Unido).

El terapeuta la revisará y la confirmará. Recibirás otro correo cuando quede aprobada y programada.

Gracias por confiar en EmpathAI.

Un cordial saludo,
El equipo de EmpathAI`,
    }),

    requestTherapist: ({ clientName, therapistName, when }) => ({
      subject: "Nueva solicitud de cita en EmpathAI",
      text: `Hola ${therapistName}:

Tienes una nueva solicitud de cita de ${clientName} para el ${when} (hora del Reino Unido).

Por favor, revísala y confirma la reserva.

Saludos cordiales,
El equipo de EmpathAI`,
    }),

    confirmationClient: ({ clientName, therapistName, when, link }) => ({
      subject: "Tu cita en EmpathAI está confirmada",
      text: `Hola ${clientName}:

Tu cita con ${therapistName} está confirmada para el ${when}.

${link ? `Únete a tu sesión aquí:\n${link}\n` : `Te enviaremos el enlace de la sesión antes de la cita.\n`}

Gracias por confiar en EmpathAI.

Un cordial saludo,
El equipo de EmpathAI`,
    }),

    confirmationTherapist: ({ clientName, therapistName, when, link }) => ({
      subject: "Nueva cita reservada en EmpathAI",
      text: `Hola ${therapistName}:

Tienes una nueva cita con ${clientName} el ${when}.

${link ? `Únete a tu sesión aquí:\n${link}\n` : `Todavía no se ha generado el enlace de la sesión. Por favor, consulta tu panel.\n`}

Recuerda que todas las citas se rigen por la zona horaria del Reino Unido.

El equipo de EmpathAI`,
    }),

    slotTaken: ({ clientName, therapistName }) => ({
      subject: "Horario de cita ya ocupado - EmpathAI",
      text: `Hola ${clientName}:

Tu cita con ${therapistName} ha sido ocupada por otra persona de la lista de espera.

Gracias por confiar en EmpathAI.

Saludos cordiales,
El equipo de EmpathAI`,
    }),

    rejection: ({ clientName, therapistName }) => ({
      subject: "Cita rechazada - EmpathAI",
      text: `Hola ${clientName}:

Tu cita con ${therapistName} ha sido cancelada por motivos de agenda.

Gracias por confiar en EmpathAI.

Saludos cordiales,
El equipo de EmpathAI`,
    }),

    therapistCancelled: ({ clientName, therapistName, when }) => ({
      subject: "Tu sesión en EmpathAI ha sido cancelada",
      text: `Hola ${clientName}:

Tu cita con ${therapistName} el ${when} ha sido cancelada porque el terapeuta ha actualizado su agenda.

Puedes reservar un nuevo horario en la aplicación cuando quieras.

— EmpathAI`,
    }),

    proposedReschedule: ({ clientName, therapistName, when, altLines }) => ({
      subject: "Tu terapeuta ha propuesto un nuevo horario",
      text: `Hola ${clientName}:

Tu cita con ${therapistName} (antes el ${when}) necesita cambiarse.
Te ha propuesto el siguiente horario alternativo:

${altLines || "• (Abre la aplicación para elegir un nuevo horario)"}

Por favor, abre EmpathAI para aceptar una de las opciones o elegir otro horario.

— EmpathAI`,
    }),

    pendingRejected: ({ clientName, therapistName, when }) => ({
      subject: "No se ha podido aceptar tu solicitud",
      text: `Hola ${clientName}:

Tu solicitud de cita pendiente con ${therapistName} para el ${when} no se ha podido aceptar porque el terapeuta ha actualizado su disponibilidad.

Por favor, abre EmpathAI para solicitar otro horario.

— EmpathAI`,
    }),

    availabilitySummary: ({ therapistName, action, date, slot, cancelled, proposed, rejected }) => ({
      subject: `Cambio de disponibilidad procesado: ${action}`,
      text: `Hola ${therapistName}:

Tu cambio de disponibilidad se ha aplicado:
• Acción: ${action}
• Fecha/Horario: ${date || "-"} ${slot ? `(${slot})` : ""}

Clientes afectados:
• Cancelados: ${cancelled}
• Reprogramación propuesta: ${proposed}
• Rechazados automáticamente (pendientes): ${rejected}

— EmpathAI`,
    }),
  },
};

// Stand-ins for a missing username, so an English word never lands mid-Spanish.
const FALLBACK_NAMES = {
  en: { client: "there", therapist: "your therapist", therapistPlain: "the therapist", therapistTitle: "Therapist" },
  es: { client: "paciente", therapist: "tu terapeuta", therapistPlain: "el terapeuta", therapistTitle: "terapeuta" },
};

/** Copy for a locale, falling back to English for anything unknown. */
export function copyFor(locale) {
  return emailCopy[locale] || emailCopy.en;
}

export function fallbackNamesFor(locale) {
  return FALLBACK_NAMES[locale] || FALLBACK_NAMES.en;
}
