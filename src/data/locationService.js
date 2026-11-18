// src/data/locationService.js
import locationData from './locations.json';

export const Country = {
  getAllCountries: () => locationData.countries,
};

export const State = {
  getStatesOfCountry: (countryCode) => {
    if (!countryCode) return [];
    return locationData.states[countryCode] || [];
  },
};

export const City = {
  getCitiesOfState: (countryCode, stateCode) => {
    if (!countryCode || !stateCode) return [];
    return locationData.cities[`${countryCode}-${stateCode}`] || [];
  },
};