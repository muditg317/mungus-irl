import React, { useContext, useState, useReducer, useCallback, useEffect, useMemo } from "react";
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';


import { isEmpty, upperFirstChar } from 'utils';

import { store } from 'state-management';
import { pullTaskManagerDataAction, updateTaskManagerDataAction } from "state-management/actions/taskManagerActions";

import availableMobileTasks from 'components/mobile-tasks';

import { UserTaskDescription, MobileTaskDescription } from './task-description';
import PreviewModal from './previewModal';

const farCheckCircle = ['far','check-circle'];

const areDifferent = (task1, task2) =>
  // console.log(task1, task2) ||
  !task1 || !task2
  || task1.id !== task2.id
  || task1.taskname !== task2.taskname
  || task1.maxTime !== task2.maxTime
  || task1.format !== task2.format
  || task1.canBeNonVisual !== task2.canBeNonVisual
  || task1.enabled !== task2.enabled;

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
      saved: false,
      isNew: true
    }]);
  }
  if (updateID) {
    // state.find(task => task.id === updateID)[field] = newValue;
    // return state;
    // ^^ does not update state because of Object.is
    return state.map(task => task.id !== updateID ? task : ({ ...task, [field]: newValue, saved: false, isNew: false }));
  }
  console.log("unknown update action", state, action);
};

const TaskManager = () => {
  const { state, dispatch } = useContext(store);
  const pullTaskManagerData = useCallback((...args) => pullTaskManagerDataAction(dispatch)(...args), [dispatch]);
  const updateTaskManagerData = useCallback((...args) => updateTaskManagerDataAction(dispatch)(...args), [dispatch]);
  const [ userData, setUserData ] = useState(state.user);
  const [ userTaskData, updateUserTaskData ] = useReducer(userTaskListReducer, state.taskManager.userTasks || []);
  const [ mobileTaskIDs, setMobileTaskIDs ] = useState(state.taskManager.mobileTasks || []);
  const history = useHistory();

  const [ preview, setPreview ] = useState();

  const anyUnsaved = useMemo(() =>
    // console.log(userTaskData, state.taskManager.userTasks) ||
    userTaskData.length !== state.taskManager.userTasks.length
    || mobileTaskIDs.length !== state.taskManager.mobileTasks.length
    // || userTaskData.some(task => !state.taskManager.userTasks.find(t => t.id === task.id))
    || userTaskData.some(task => (!task.saved && areDifferent(task, state.taskManager.userTasks.find(t => t.id === task.id))) || ((task.saved = true) && false))
    || state.taskManager.userTasks.some(task => !userTaskData.find(t => t.id === task.id))
    || mobileTaskIDs.some(id => !state.taskManager.mobileTasks.includes(id))
    || state.taskManager.mobileTasks.some(id => !mobileTaskIDs.includes(id))
  , [userTaskData, mobileTaskIDs, state.taskManager.userTasks, state.taskManager.mobileTasks]);

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
    // const match = taskToDelete.taskname.trim().search(/^Task ([\d]+)$/);
    if (taskToDelete.isNew) {//match && parseInt(match) === index + 1 && taskToDelete.enabled && taskToDelete.maxTime === 20 && taskToDelete.format === 'short' && taskToDelete.canBeNonVisual) {
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

  const saveTasks = useCallback(() => {
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

  useEffect(() => {
    const beforeUnload = (event) => {
      if (anyUnsaved) {
        // if (window.confirm(`Are you sure you exit without saving your tasks?`)) {
        //   console.log("ignore warning!");
        // } else {
        // console.log('save before leaving');
        saveTasks();
        // event.preventDefault();
        // event.returnValue = 'Are you sure you exit without saving your tasks?';
        // return 'Are you sure you exit without saving your tasks?';
        // }
      }
      // console.log('leave!');
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('locationchange', beforeUnload);
    // const unblock = history.block(tx => {
    //   console.log(tx);
    //   const url = tx.pathname;
    //
    // });
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('locationchange', beforeUnload);
      // unblock();
    };
  }, [anyUnsaved, saveTasks]);

  return (
    <div className="h-full max-h-fit-borders w-full overflow-y-auto flex flex-col items-center text-white">
      <div className="w-full h-20 min-h-fit bg-gray-900 flex items-center justify-center p-4">
        <h1 className="text-3xl font-bold min-h-fit max-w-full">
          {`Welcome ${userData.username}!`}
        </h1>
      </div>
      <div className="w-full h-20 min-h-fit bg-gray-800 flex items-center justify-center p-3">
        <h2 className="text-xl font-semibold min-h-fit max-w-full">
          Configure the tasks you like to play with! <span className="text-base">You should add location to the name field</span>
        </h2>
      </div>
      <div className="w-full h-fill bg-gray-700 bg-clip-border">
        <div className="w-full md:w-auto md:container mx-auto p-2 bg-gray-700 flex flex-col items-center">
          <div className="w-full flex flex-row items-center justify-between">
            <button onClick={() => history.push('/setup-tasks')} className="mr-auto min-w-fit p-2 flex flex-row items-center border border-blue-500 rounded-full hover:border-none hover:bg-blue-500 text-blue-500 hover:text-white">
              <p className="block mr-2">Setup Tasks</p><FontAwesomeIcon icon="cogs" size='lg' />
            </button>
            {anyUnsaved && <button onClick={saveTasks} className="ml-auto min-w-fit p-2 flex flex-row items-center border border-blue-500 rounded-full hover:border-none hover:bg-blue-500 text-blue-500 hover:text-white">
              <p className="block mr-2">Save</p><FontAwesomeIcon icon={farCheckCircle} size='lg' />
            </button>}
          </div>
          <div className="w-full flex flex-row items-center justify-between mb-3">
            <h3 className="w-fill text-center text-lg">Physical Tasks</h3>
          </div>
          <div className="w-full mb-2 bg-gray-700 flex flex-col items-center divide-y divide-white">
            {userTaskData.map((taskDatum, index) => {
              return <UserTaskDescription key={taskDatum.id} task={taskDatum} errors={taskErrorsByIndex && taskErrorsByIndex[index]} deleteTask={() => deleteTask(taskDatum)} updateTask={updateUserTaskData} />
            })}
          </div>
          <button onClick={() => updateUserTaskData({create:true})} className="ml-auto self-end p-2 flex flex-row items-center border border-green-500 rounded-full hover:border-none hover:bg-green-500 text-green-500 hover:text-white">
            <p className="hidden md:block mr-2">Add</p><FontAwesomeIcon icon="plus-circle" size='lg' />
          </button>
        </div>
        <div className="w-full md:w-auto md:container mx-auto p-2 bg-gray-700">
          <h3 className="w-full bg-gray-700 text-center mb-3 text-lg">Mobile Tasks</h3>
          <div className="w-full bg-gray-700 flex flex-col items-center divide-y divide-white">
            { state.taskManager.mobileTaskInfo.map(taskDatum => {
              return <MobileTaskDescription key={taskDatum.id} task={taskDatum} selected={mobileTaskIDs.includes(taskDatum.id)} selectTask={() => setMobileTaskIDs(mobileTaskIDs.concat([taskDatum.id]))} unselectTask={() => setMobileTaskIDs(mobileTaskIDs.filter(taskID => taskID !== taskDatum.id))} previewTask={() => setPreview(availableMobileTasks[taskDatum.taskname])} />
            })}
            { Object.values(availableMobileTasks).filter(taskDatum => !state.taskManager.mobileTaskInfo.find(serverTask => serverTask.id === taskDatum.id)).map((taskDatum) => {
              return <MobileTaskDescription key={taskDatum.id} experimental={true} task={taskDatum} previewTask={() => setPreview(availableMobileTasks[taskDatum.taskname])} />
            })}
          </div>
        </div>
      </div>
      <PreviewModal mobileTask={preview} finish={() => setPreview()} shown={!!preview} onExit={() => setPreview()}
          experimental={preview && !state.taskManager.mobileTaskInfo.find(serverTask => serverTask.id === preview.id)}
          selected={preview && state.taskManager.mobileTaskInfo.find(serverTask => serverTask.id === preview.id) && mobileTaskIDs.includes(preview.id)}
          selectTask={preview && state.taskManager.mobileTaskInfo.find(serverTask => serverTask.id === preview.id) && (() => setMobileTaskIDs(mobileTaskIDs.concat([preview.id])))}
          unselectTask={preview && state.taskManager.mobileTaskInfo.find(serverTask => serverTask.id === preview.id) && (() => setMobileTaskIDs(mobileTaskIDs.filter(taskID => taskID !== preview.id)))}
        />
    </div>
  );
};

export default TaskManager;
