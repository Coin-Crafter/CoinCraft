import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom'; 
import Listing from './Listing/listing';
import Header from './Header/header';
import Content from './Homepage/Content';

export default function Index() {
    return (
        <Router>
            <Header/>
            <Routes>
                <Route path="/" element={
                    <>
                       <Content/>
                    </>
                } />
                <Route path="/project-listing" element={ 
                    <>
                        <Listing/>
                    </>
                }/>

            </Routes>
        </Router>
    );
}