import './App.css'
import { Route, Routes } from 'react-router-dom'
import AuthWrapper from './components/AuthWrapper'
import  FormBuilderPage from './pages/FormBuilder'
import FormDetailPage from './pages/FormDetail'
import FormsListPage from './pages/FormList'
import FormSubmitPage from './pages/FormSubmit'
import FormResponsesPage from './pages/FormResponse'
import Home from './pages/Home'

function App() {

  return (
    
    <AuthWrapper>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/form/new" element={<FormBuilderPage/>} />
        <Route path="/dashboard" element={<FormsListPage />} />
        <Route path="/forms/:formId" element={<FormDetailPage />} />
        <Route path="/forms/:formId/responses" element={<FormResponsesPage />} />
        <Route path="/forms/:formId/submit" element={<FormSubmitPage />} />
      </Routes>
    </AuthWrapper>
    )
}

export default App
