import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import Navbar from './components/Navbar'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [items, setItems] = useState([])
  const [editingID, setEditingID] = useState(null)
  const [editingValue, setEditingValue] = useState('')


  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/items`)
      .then(res => res.json())
      .then((data) => setItems(data))
      .catch((error) => console.error('Error fetching items:', error))
  }, [])



  return (
    
    <>
      <Navbar />


    </>
  )
}

export default App
