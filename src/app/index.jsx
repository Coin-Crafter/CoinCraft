import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom'; 
import Listing from './Listing/listing';
import Header from './Header/header';
import Content from './Homepage/Content';
import Add from './AddProject/addproject';
import Find from './FindProject/findproject';
import Verify from './Verifier/verifier';

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
                <Route path="/add-project" element={ 
                    <>
                        <Add/>
                    </>
                }/>
                <Route path="/find-project" element={ 
                    <>
                        <Find/>
                    </>
                }/>
                <Route path="/be-a-verifier" element={ 
                    <>
                        <Verify/>
                    </>
                }/>
            </Routes>
        </Router>
    );
}