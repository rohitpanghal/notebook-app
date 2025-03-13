import React from 'react'
import EditableText from './components/editable-text'
import { NoteBookMenuBar } from './components/notebook-menubar'

const NoteBook = () => {
  return (
    <>
    <NoteBookMenuBar/>
    <EditableText/>
    </>
  )
}

export default NoteBook