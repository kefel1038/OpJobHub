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
        }, elementId: string) => void
        TranslateElement: {
          InlineLayout: { SIMPLE: number }
        }
      }
    }
  }
}

export function useGoogleTranslate() {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,ar",
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

export function GoogleTranslateInit() {
  useGoogleTranslate()
  return <div id="google_translate_element" className="hidden" />
}
