import React from 'react';

import './style.css';

import SlackButton from '../SlackButton';

export default props => (
    <nav className="header">
        <div className="container">
            <div className="header__content">
                <div className="header__branding">
                    <a href="https://github.com/backend-br" className="header__logo">BackEnd Brasil</a>
                    <p className="header__description">A maior comunidade de BackEnd do Brasil</p>
                </div>
                <SlackButton />
            </div>
        </div>
    </nav>
);
