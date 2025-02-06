import { Language } from "../types/types";

export const languages: Record<string, Language> = {
  en: {
    greeting: "Hi, I'm Rodrigo",
    role: "Full Stack Developer",
    helpText: "How can I help you?",
    placeholder: "Type your message...",
    actions: {
      project: "Start Project",
      hire: "Hire Me",
      skills: "View Skills"
    },
    menu: {
      skills: "Skills",
      blog: "Blog",
      contact: "Contact"
    }
  },
  es: {
    greeting: "Hola, soy Rodrigo",
    role: "Desarrollador Full Stack",
    helpText: "¿Cómo puedo ayudarte?",
    placeholder: "Escribe tu mensaje...",
    actions: {
      project: "Iniciar Proyecto",
      hire: "Contrátame",
      skills: "Ver Habilidades"
    },
    menu: {
      skills: "Habilidades",
      blog: "Blog",
      contact: "Contacto"
    }
  },
  de: {
    greeting: "Hi, ich bin Rodrigo",
    role: "Fullstack-Entwickler",
    helpText: "Wie kann ich dir helfen?",
    placeholder: "Nachricht eingeben...",
    actions: {
      project: "Projekt starten",
      hire: "Mich einstellen",
      skills: "Fähigkeiten"
    },
    menu: {
      skills: "Fähigkeiten",
      blog: "Blog",
      contact: "Kontakt"
    }
  }
}; 