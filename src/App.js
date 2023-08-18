import './App.css';
import FindingFalcon from './components/find';
import { SnackbarProvider } from "notistack";

function App() {
  return (
    <div className="App"> 
      <SnackbarProvider iconVariant={{
    success: '✅ ',
    error: '✖️ ',
    warning: '⚠️ ',
    info: 'ℹ️ ',
  }}>   
        <FindingFalcon />
      </SnackbarProvider> 
    </div>
  );
}

export default App;
