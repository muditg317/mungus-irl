import React from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

export function addArray(array, ...arrays) {
    let newArr = [...array];
    arrays.forEach(array => {
        array.forEach((item, i) => {
            newArr[i] += item;
        });
    });
    return newArr;
}

export function isDev() {
    return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
}

export function isMobile() {
    return window.ontouchstart !== undefined;
}

export function isReactComponent(component) {
    (typeof component === 'function' &&
                (!!component.prototype.isReactComponent
                    || String(component).includes('return React.createElement')))
}

export function windowWidth() {
    return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
}

export function windowHeight() {
    return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
}

export function spannifyText(text, afterTheseString) {
    if (afterTheseString === 'CAPITALS') {
        return text.split('').map((char, i) => {
            if (i > 0 && char === char.toUpperCase()) {
                return (
                    <React.Fragment key={i}>
                        <wbr />
                        {char}
                    </React.Fragment>
                );
            }
            return char;
        });
    } else if (afterTheseString) {
        return text.split(new RegExp(`([${afterTheseString}])`,'g')).map((str, i) => {
            if (i > 0) {
                return (
                    <React.Fragment key={i}>
                        <wbr />
                        {str}
                    </React.Fragment>
                );
            }
            return str;
        });
    } else {
        return text.split('').map((char, i) => {
            if (i > 0) {
                return (
                    <React.Fragment key={i}>
                        <wbr />
                        {char}
                    </React.Fragment>
                );
            }
            return char;
        });
    }
}

export function upperFirstChar(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function upperFirstCharOnly(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export function setAuthToken(token) {
  if (token) {
    // Apply authorization token to every request if logged in
    axios.defaults.headers.common['Authorization'] = token;
  } else {
    // Delete auth header
    delete axios.defaults.headers.common['Authorization'];
  }
};

export function checkValidAuthToken() {
  if (localStorage.jwtToken) {
    const token = localStorage.jwtToken;  // Set auth token header auth
    const decoded = jwt_decode(token);  // Decode token and get user info and exp
    const currentTime = Date.now() / 1000; // to get in milliseconds
    return { token, decoded, authenticated: decoded.exp > currentTime };
  }
  return false;
}

export function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}

export function handleChange(setter, maxLength) {
  return event => {
    maxLength && (event.target.value = event.target.value.substring(0, maxLength));
    setter(event.target.value);
  }
}

export function clamp(value, min, max) {
  value = typeof value !== 'number' ? parseFloat(value) : value;
  return Math.min(Math.max(value, min), max);
}

export function getRandomSubarray(arr, size) {
  // if (size === undefined) size = arr.length;
  let shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

export function shuffled(arr) {
  return getRandomSubarray(arr, arr.length);
}

export function map(value, min, max, newMin, newMax) {
  return (value - min) / (max - min) * (newMax - newMin) + newMin;
}

export function randInRange(min, max, options) {
  (options === undefined) && (max === undefined || typeof max === "number"? (options = {}) : ((options = max) && (max = min)));
  (max === undefined) && (max = min) && (min = 0);
  const { integer = false } = options;
  const rand = Math.random() * (max - min) + min;
  return integer ? Math.floor(rand) : rand;
}
