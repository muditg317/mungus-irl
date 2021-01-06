import React, {  } from 'react';

import { upperFirstCharOnly } from 'utils';


export default function EndScreen(props) {
  // console.log(props);
  const { username, hostname, winners, crewmates, imposters, resetGame } = props;

  return (
    <>
      <div className={`w-full p-2.5 flex flex-row`}>
        <p className={`text-2xl text-center font-bold ${winners === "CREWMATES" ? "text-blue-300" : "text-red-500"}`}>
          {winners && `${upperFirstCharOnly(winners)} Win!!`}
        </p>
      </div>
      <div className={`w-full p-2.5 flex flex-col`}>
        <p className="text-xl text-center font-bold text-blue-300 mb-2">
          Crewmates
        </p>
        <div className={`w-full flex flex-row flex-wrap`}>
          {crewmates && crewmates.map(crewmate => {
            return <div key={crewmate} className="p-4">
              <p className="text-lg text-blue-300">{crewmate}</p>
            </div>
          })}
        </div>
      </div>
      <div className={`w-full p-2.5 flex flex-col`}>
        <p className="text-xl text-center font-bold text-red-500 mb-2">
          Imposters
        </p>
        <div className={`w-full flex flex-row flex-wrap`}>
          {imposters && imposters.map(imposter => {
            return <div key={imposter} className="p-4">
              <p className="text-lg text-red-500">{imposter}</p>
            </div>
          })}
        </div>
      </div>
      <div className="w-full h-fill mt-auto"></div>
      { username === hostname && <div className="w-full mt-1 pt-1 flex flex-row justify-center items-end">
        <button className={`pb-3 pt-2.5 px-4  rounded-full border-none bg-gray-300 text-3xl font-bold text-red-500`} onClick={() => resetGame()}>
          Start Over!
        </button>
      </div> }
    </>
    );
}
