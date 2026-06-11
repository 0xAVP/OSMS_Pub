import './appkitConfig';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import StartPage from './StartPage';
import MintEchoPage from './MintEchoPage';
import GamePage from './GamePage';
import WhitepaperPage from './whitepaper/WhitepaperPage';

const container = document.getElementById('root');
const root = createRoot(container);

console.log('Rendering index.jsx');

root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<StartPage/>}/>
            <Route path="/mint-echo" element={<MintEchoPage/>}/>
            <Route path="/game" element={<GamePage/>}/>
            <Route path="/whitepaper" element={<WhitepaperPage/>}/>
        </Routes>
    </BrowserRouter>
);