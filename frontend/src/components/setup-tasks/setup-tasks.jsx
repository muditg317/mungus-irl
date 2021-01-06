import React, { useContext, useState, useCallback, useEffect, useMemo } from "react";
// import { useHistory } from 'react-router-dom';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import QRCode from 'qrcode';

import { isEmpty } from 'utils';

import { store } from 'state-management';
import { pullTaskManagerDataAction } from "state-management/actions/taskManagerActions";

import availableMobileTasks from 'components/mobile-tasks';

const qrOpts = {
  errorCorrectionLevel: 'H',
  version: 4,
  scale: 8
};

const mobileIDsToData = (ids) => {
  return Object.values(availableMobileTasks).filter(mobileTask => ids.includes(mobileTask.id));
};

const ViewQrCodes = () => {
  const { state, dispatch } = useContext(store);
  const pullTaskManagerData = useCallback((...args) => pullTaskManagerDataAction(dispatch)(...args), [dispatch]);
  const [ userData, setUserData ] = useState(state.user);
  const [ userTaskData, setUserTaskData ] = useState((state.taskManager.userTasks || []).filter(task => task.enabled));
  const [ mobileTaskData, setMobileTaskData ] = useState(mobileIDsToData(state.taskManager.mobileTasks || []));
  const [ qrCodes, setQrCodes ] = useState([]);
  // const history = useHistory();
  const taskData = useMemo(() => [...userTaskData, ...mobileTaskData], [userTaskData, mobileTaskData]);

  useEffect(() => {
    setUserData(state.user);
  }, [state, state.user]);

  useEffect(() => {
    if (!isEmpty(userData)) {
      // console.log(userData);
      pullTaskManagerData(true);
    // } else {
    //   console.log(userData);
    }
  }, [pullTaskManagerData, userData]);

  useEffect(() => {
    // console.log("update user task data");
    setUserTaskData(state.taskManager.userTasks.filter(task => task.enabled));
  }, [state.taskManager.userTasks]);
  useEffect(() => {
    // console.log("update mobile task data");
    setMobileTaskData(mobileIDsToData(state.taskManager.mobileTasks));
  }, [state.taskManager.mobileTasks]);

  useEffect(() => {
    if (taskData.length) {
      (async () => {
        try {
          const qrURLs = await Promise.all(taskData.map(async (task) => {
            return await QRCode.toDataURL(task.qrID, qrOpts);
          }));
          // console.log(qrURLs);
          setQrCodes(qrURLs);
        } catch (error) {
          console.error(error);
        } finally {

        }
      })();
    }
  }, [taskData]);

  return (
    <div className="container mx-auto h-full flex flex-col print:flex-row print:flex-wrap items-center text-black bg-white overflow-y-scroll">
      <div className="print:hidden w-full p-2">
        <h1 className="text-2xl text-center font-bold">Setup your devices and tasks!</h1>
        <p className="text-lg font-semibold"><button className="font-bold underline" onClick={() => window.print()}>Print</button> these QR codes and place them wherever you want to complete each one from! <span className="text-sm">(Printing from mobile doesn't work well)</span></p>
        <p className="text-base font-semibold ml-2">For physical tasks, make sure to place them right next to the corresponding device!</p>
        <p className="text-base font-semibold ml-2">Copy these device IDs into to the code for each of your physical task devices!</p>
      </div>
      <div className="flex flex-col md:flex-row md:flex-wrap print:flex-row print:flex-wrap items-center md:justify-between text-black">
        {taskData.map((task, index) => {
          // console.log(task.taskname, qrCodes[index]);
          const mobile = !task.physicalDeviceID;
          return <div key={task.qrID} className="flex flex-col items-center justify-start py-2 print:m-0 w-full md:w-fit print:w-1/2 print:h-124 print:max-w-1/2 print:max-h-124">
            <h2 className="text-3xl font-extrabold">{`${task.taskname}${mobile ? ` (mobile)` : ''}`}</h2>
            <div className="w-full md:w-fit flex flex-col items-center">
              <div className="block print:hidden flex flex-col pl-2">
                {!mobile &&
                  <>
                    <p className="">Device ID:</p>
                    <p className="ml-3 text-sm">{task.physicalDeviceID}</p>
                  </>
                }
              </div>
              { qrCodes.length &&
                <img className="mb-3 print:m-0 w-1/2 md:max-w-md print:w-fit" src={qrCodes[index]} alt={`QR code for ${task.taskname}`}></img>
              }
            </div>
          </div>
        })}
      </div>
      <button className="rounded-full p-4 text-xl text-black border border-black m-4 print:hidden" onClick={() => window.print()}>
        Print QR Codes!
      </button>
    </div>
  );
};

export default ViewQrCodes;
