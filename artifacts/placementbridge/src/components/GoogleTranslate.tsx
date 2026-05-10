import { useEffect } from "react"

declare global {
  interface Window {
    googleTranslateElementInit: () => void
    google: {
      translate: {
        TranslateElement: new (config: {
          pageLanguage: string
          includedLanguages: string
          autoDisplay: boolean
        }, elementId: string) => void & {
          InlineLayout: { SIMPLE: number }
        }
      }
    }
  }
}

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "fr", label: "French", native: "Français" },
  { code: "sw", label: "Kiswahili", native: "Kiswahili" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "tl", label: "Tagalog", native: "Tagalog" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "ne", label: "Nepali", native: "नेपाली" },
  { code: "so", label: "Somali", native: "Soomaali" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "fa", label: "Persian", native: "فارسی" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ps", label: "Pashto", native: "پښتو" },
  { code: "ku", label: "Kurdish", native: "Kurdî" },
];

const ALL_CODES = LANGUAGES.map((l) => l.code).join(",");

export function useGoogleTranslate() {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: ALL_CODES,
          autoDisplay: false,
        },
        "google_translate_element"
      )
    }

    const script = document.createElement("script")
    script.id = "google-translate-script"
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
    document.body.appendChild(script)
  }, [])
}

export function changeLanguage(lang: string) {
  const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
  if (select) {
    select.value = lang
    select.dispatchEvent(new Event("change"))
  }
}

export function getCurrentLang(): string {
  try {
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null
    if (select) return select.value || "en"
  } catch {}
  return "en"
}

export function GoogleTranslateInit() {
  useGoogleTranslate()
  return <div id="google_translate_element" className="hidden" />
}
