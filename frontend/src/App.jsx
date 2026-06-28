import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
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

      <section id="items-list">
        <h2>Items</h2>
        <ul>

          {items.map(item => (
          <li key={item.id}>
            {editingID===item.id ? (

            <>
  
            <input
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            />

            <button onClick={() => {
            fetch(`${import.meta.env.VITE_API_URL}/items/${item.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name: editingValue })
            })
            .then((res) => {
              if (!res.ok) throw new Error('Update failed')
              return res.json()
            })
            .then((updatedItem) => {
              setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i))
              setEditingID(null)
              setEditingValue('')
            })
            .catch((error) => console.error('Error updating item:', error))
          }}>Save</button>

          </>

        ) : ( 
            item.name)}



          <button onClick={() => {
            setEditingID(item.id)
            setEditingValue(item.name)
          }}>Edit</button>


          <button onClick={() => {   
            fetch(`${import.meta.env.VITE_API_URL}/items/${item.id}`, {
              method: 'DELETE'
            })
            .then((res) => {
              if (!res.ok) throw new Error('Delete failed')
              setItems(items.filter(i => i.id !== item.id))
            })
            .catch((error) => console.error('Error deleting item:', error))}}>Delete</button>
            
            
            </li>
        ))}
        </ul>
        

        <form onSubmit={(e) => {
          e.preventDefault()
          fetch(`${import.meta.env.VITE_API_URL}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: inputValue })
          })
          .then(res => res.json())
          .then((newItem) => {
            setItems([...items, newItem])
          
            setInputValue('')
          })
          .catch((error) => console.error('Error adding item:', error))
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add new item"
          />
          <button type="submit" disabled={inputValue.trim() === ''}>Add Item</button>
        </form>

    </section>

    </>
  )
}

export default App
