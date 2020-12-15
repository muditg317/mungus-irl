import React, { useContext, useState, useReducer, useCallback, useEffect, useMemo } from "react";
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';


import { isEmpty, upperFirstChar } from 'utils';

import { store } from 'state-management';
import { pullTaskManagerDataAction, updateTaskManagerDataAction } from "state-management/actions/taskManagerActions";

// import availableMobileTasks from 'components/mobile-tasks';

import { UserTaskDescription, MobileTaskDescription } from './task-description';

const userTaskListReducer = (state, action) => {
  const { updateID, field, newValue, reset, deleteID, create } = action;
  if (reset) {
    return reset;
  }
  if (deleteID) {
    return state.filter(task => task.id !== deleteID);
  }
  if (create) {
    return state.concat([{
      id: `${Math.random()}`.substring(2),
      taskname: `Task ${state.length+1}`,
      maxTime: 20,
      format: 'short',
      canBeNonVisual: true,
      enabled: true,
      saved: false
    }]);
  }
  if (updateID) {
    // state.find(task => task.id === updateID)[field] = newValue;
    // return state;
    // ^^ does not update state because of Object.is
    return state.map(task => task.id !== updateID ? task : ({ ...task, [field]: newValue, saved: false }));
  }
};

const TaskManager = () => {
  const { state, dispatch } = useContext(store);
  const pullTaskManagerData = useCallback((...args) => pullTaskManagerDataAction(dispatch)(...args), [dispatch]);
  const updateTaskManagerData = useCallback((...args) => updateTaskManagerDataAction(dispatch)(...args), [dispatch]);
  const [ userData, setUserData ] = useState(state.user);
  const [ userTaskData, updateUserTaskData ] = useReducer(userTaskListReducer, state.taskManager.userTasks || []);
  const [ mobileTaskIDs, setMobileTaskIDs ] = useState(state.taskManager.mobileTasks || []);
  const history = useHistory();

  const anyUnsaved = useMemo(() =>
    userTaskData.some(task => !task.saved)
    || mobileTaskIDs.some(id => !state.taskManager.mobileTasks.includes(id))
    || state.taskManager.mobileTasks.some(id => !mobileTaskIDs.includes(id))
  , [userTaskData, mobileTaskIDs, state.taskManager.mobileTasks]);

  useEffect(() => {
    const beforeUnload = (event) => {
      if (anyUnsaved) {
        // if (window.confirm(`Are you sure you exit without saving your tasks?`)) {
        //   console.log("ignore warning!");
        // } else {
          event.preventDefault();
          event.returnValue = '';
          return '';
        // }
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    // const unblock = history.block(tx => {
    //   console.log(tx);
    //   const url = tx.pathname;
    //
    // });
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      // unblock();
    };
  }, [history, anyUnsaved]);

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
    updateUserTaskData({reset: state.taskManager.userTasks});
  }, [state.taskManager.userTasks]);
  useEffect(() => {
    // console.log("update mobile task data");
    setMobileTaskIDs(state.taskManager.mobileTasks);
  }, [state.taskManager.mobileTasks]);

  const taskErrorsByIndex = useMemo(() => {
    // console.log("update task errors");
    return state.taskManager.errors.tasks && state.taskManager.errors.tasks.constructor.name === "Array" && state.taskManager.errors.tasks;
  }, [state]);

  // console.log(taskErrorsByIndex);

  const deleteTask = useCallback(taskToDelete => {
    if (taskToDelete.taskname.trim().search(/^Task [\d]+$/) !== -1 && taskToDelete.maxTime === 20 && taskToDelete.format === 'short' && taskToDelete.canBeNonVisual) {
      updateUserTaskData({deleteID:taskToDelete.id})
      return;
    }
    confirmAlert({
      title: `Delete ${upperFirstChar(taskToDelete.format)} Task: ${taskToDelete.taskname || ''}`,
      message: 'Are you sure you want to do this?',
      buttons: [
        {
          label: 'Yes, Delete',
          onClick: () => updateUserTaskData({deleteID:taskToDelete.id})
        },
        {
          label: 'Cancel'
        }
      ]
    });
  }, []);

  const saveTasks = useCallback((event) => {
    const payload = {
      userTaskData: userTaskData.map(userTask => {
        return userTask;
      }),
      mobileTaskIDs: mobileTaskIDs.map(mobileTask => mobileTask)
    };
    updateTaskManagerData(payload, () => {
      // history.push('/setup-tasks');
    });
  }, [userTaskData, mobileTaskIDs, updateTaskManagerData]);

  // console.log(userTaskData);

  return (
    <div className="h-full w-screen bg-red-700 flex flex-col items-center text-white">
      <div className="w-full h-20 min-h-fit bg-gray-900 flex items-center justify-center p-4">
        <h1 className="text-3xl font-bold min-h-fit max-w-full">
          {`Welcome ${userData.username}!`}
        </h1>
      </div>
      <div className="w-full h-20 min-h-fit bg-gray-800 flex items-center justify-center p-3">
        <h2 className="text-xl font-semibold min-h-fit max-w-full">
          Configure the tasks you like to play with!
        </h2>
      </div>
      <div className="w-full h-fill bg-gray-700 p-2">
        <div className="container mx-auto bg-gray-700 flex flex-col items-center">
          <div className="w-full flex flex-row items-center justify-between">
            <button onClick={() => history.push('/setup-tasks')} className="mr-auto min-w-fit p-2 flex flex-row items-center border border-blue-500 rounded-full hover:border-none hover:bg-blue-500 text-blue-500 hover:text-white">
              <p className="block mr-2">Setup Tasks</p><FontAwesomeIcon icon={['fas','cogs']} size='lg' />
            </button>
            {anyUnsaved && <button onClick={saveTasks} className="ml-auto min-w-fit p-2 flex flex-row items-center border border-blue-500 rounded-full hover:border-none hover:bg-blue-500 text-blue-500 hover:text-white">
              <p className="block mr-2">Save</p><FontAwesomeIcon icon={['far','check-circle']} size='lg' />
            </button>}
          </div>
          <div className="w-full flex flex-row items-center justify-between mb-3">
            <h3 className="w-fill text-center text-lg">Physical Tasks</h3>
          </div>
          <div className="w-full mb-2 bg-gray-700 flex flex-col items-center divide-y divide-white">
            {userTaskData.map((taskDatum, index, arr) => {
              // console.log("user task", index, taskDatum, arr);
              return <UserTaskDescription key={taskDatum.id} task={taskDatum} errors={taskErrorsByIndex && taskErrorsByIndex[index]} deleteTask={() => deleteTask(taskDatum)} updateTask={updateUserTaskData} />
            })}
          </div>
          <button onClick={() => updateUserTaskData({create:true})} className="ml-auto self-end p-2 flex flex-row items-center border border-green-500 rounded-full hover:border-none hover:bg-green-500 text-green-500 hover:text-white">
            <p className="hidden md:block mr-2">Add</p><FontAwesomeIcon icon={['fas','plus-circle']} size='lg' />
          </button>
        </div>
        <div className="w-full bg-gray-700 pb-20">
          <h3 className="w-full bg-gray-700 text-center mb-3 text-lg">Mobile Tasks</h3>
          <div className="w-full bg-gray-700 flex flex-col items-center divide-y divide-white">
            {state.taskManager.mobileTaskInfo.map((taskDatum, index) => {
              return <MobileTaskDescription key={taskDatum.id} task={taskDatum} selected={mobileTaskIDs.includes(taskDatum.id)} selectTask={() => setMobileTaskIDs(mobileTaskIDs.concat([taskDatum.id]))} unselectTask={() => setMobileTaskIDs(mobileTaskIDs.filter(taskID => taskID !== taskDatum.id))} />
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
