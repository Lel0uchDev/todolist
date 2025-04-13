import React, { useState, useEffect } from "react";
import axios from 'axios';
import ToDoList from './ToDoList.jsx'

const API_URL = 'http://localhost:5500/api';

function App() {
        return (
          <div className="App">
            <ToDoList />
          </div>
        );
      }

export default App