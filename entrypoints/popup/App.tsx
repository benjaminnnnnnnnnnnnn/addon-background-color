import { useEffect, useState } from 'react'
import './App.css'
import flowerLogo from '../../assets/photos-flower.png'
import { browser } from 'wxt/browser'

type Petal = {
  id: string
  label: string
  color: string
  top: string
  left: string
}

const PETALS: Petal[] = [
  { id: 'orange', label: 'Orange', color: '#ec9b2a', top: '23.55%', left: '50.25%' },
  { id: 'yellow', label: 'Yellow', color: '#e4d728', top: '31.5%', left: '69.5%' },
  { id: 'green',  label: 'Green',  color: '#acd13b', top: '50.5%', left: '77%' },
  { id: 'teal',   label: 'Teal',   color: '#5db098', top: '69.5%', left: '69%' },
  { id: 'blue',   label: 'Blue',   color: '#659bd6', top: '77%', left: '50%' },
  { id: 'indigo', label: 'Indigo', color: '#9476bc', top: '69.5%', left: '31%' },
  { id: 'pink',   label: 'Pink',   color: '#c379a8', top: '50%', left: '23%' },
  { id: 'red',    label: 'Red',    color: '#e76b59', top: '31%', left: '31%' },
]

function App() {
  // null = Reset / no color (default)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  // On load: detect if body has a color set by the extension
  useEffect(() => {
    const detectBackground = async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) return

      const [injection] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // We only care about the color set by our extension
          return document.body.dataset.extBgColor || ''
        },
      })

      const color = injection?.result
      if (typeof color === 'string' && color) {
        setSelectedColor(color)        // match an existing petal
      } else {
        setSelectedColor(null)         // default to Reset
      }
    }

    void detectBackground()
  }, [])

const resetBackground = async () => {
  setSelectedColor(null)

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return

  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const clearBg = (el: HTMLElement | null) => {
        if (!el) return
        el.style.removeProperty('background-color')
        el.style.removeProperty('background-image')
      }

      const body = document.body
      const html = document.documentElement

      clearBg(html as unknown as HTMLElement)
      clearBg(body)

      const selectors = [
        'main',
        'section',
        '[role="main"]',
        '#main',
        '#content',
        '#main-content',
        '#page',
        '#root',
        '#app',
        '.main',
        '.content',
      ]

      selectors.forEach((sel) => {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => clearBg(el))
      })

      delete body.dataset.extBgColor
    },
  })
}



const applyColor = async (color: string) => {
  setSelectedColor(color)

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return

  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: (c: string) => {
      const applyBg = (el: HTMLElement | null) => {
        if (!el) return
        // Strong override for page-like containers
        el.style.setProperty('background-color', c, 'important')
        // Optionally kill background image so the color is visible
        el.style.setProperty('background-image', 'none', 'important')
      }

      const body = document.body
      const html = document.documentElement

      applyBg(html as unknown as HTMLElement)
      applyBg(body)

      // Try to catch common layout containers on many sites
      const selectors = [
        'main',
        'section',
        '[role="main"]',
        '#main',
        '#content',
        '#main-content',
        '#page',
        '#root',
        '#app',
        '.main',
        '.content',
      ]

      selectors.forEach((sel) => {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => applyBg(el))
      })

      // Mark color so popup can detect it
      body.dataset.extBgColor = c
    },
    args: [color],
  })
}



  return (
    <div className='main-content'>
      <h2>Background Color Changer</h2>

      <div className='content'>
        <img
          src={flowerLogo}
          alt="Palette de couleurs"
          className='flower-image'
        />

        {PETALS.map((petal) => (
          <button
            key={petal.id}
            onClick={() => applyColor(petal.color)}
            aria-label={petal.label}
            className='petal-button'
            style={{
              top: petal.top,
              left: petal.left,
              border:
                selectedColor === petal.color
                  ? '3px solid rgba(255,255,255,0.9)'
                  : '2px solid rgba(255,255,255,0.6)',
            }}
          />
        ))}

        <button
          onClick={resetBackground}
          aria-label="Reset"
          className='reset-button'
          style={{
            border:
              selectedColor === null
                ? '3px solid rgba(255,255,255,0.9)'
                : '2px solid rgba(255,255,255,0.6)',
          }}
        >
          Reset
        </button>
      </div>

      <div className='color-selected'>
        Selected color :{' '}
        <span
          className='color-dot'
          style={{
            backgroundColor: selectedColor ?? 'transparent',
            outline: selectedColor === null ? '1px dashed #ccc' : 'none',
          }}
        />
      </div>

      <p className='help-text'>
        Click on a petal to change the background color of the page.
      </p>
    </div>
  )
}

export default App
