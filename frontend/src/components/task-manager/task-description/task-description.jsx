import React, { useMemo } from "react";
// import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isEmpty, isMobile, clamp } from 'utils';

const handleChange = (field, object, setter, constraint) => {
  return event => {
    let value;
    if (constraint && !isEmpty(constraint)) {
      const { maxLength, range, checked, options, toggle } = constraint;
      maxLength && (value = event.target.value.substring(0, maxLength));
      range && (value = clamp(event.target.value, range[0], range[1]));
      checked && (value = event.target.checked);
      options && (value = options.includes(event.target.value) ? event.target.value : options[0]);
      toggle && (value = !object[field]);
    }
    if (value !== undefined) {
      event.target.value = value;
    } else {
      value = event.target.value;
    }
    setter({updateID:object.id, field, newValue: value});
  }
}

const UserTaskDescription = ({ task, errors, deleteTask, updateTask, ...props }) => {
  if (!isEmpty(props)) {
    console.error("PROPS NOT DESTRUCTURED", props);
  }
  // console.log(errors);
  const taskError = useMemo(() => errors || {}, [errors]);
  const color = useMemo(() => task.enabled ? "green" : "red", [task.enabled]);
  return (
    <div className="w-full bg-gray-700 py-2 first:pt-0 last:pb-0 flex flex-row items-center">
      <div className="w-full pr-2">
        <div className="w-full flex flex-wrap flex-row items-center justify-start mb-1">
          <label className="mr-1 text-lg">Name:</label>
          <input className="bg-gray-800 rounded-md pl-1 text-lg font-bold" value={`${task.taskname || ''}`} onChange={handleChange('taskname',task,updateTask,{maxLength:15})} size="10" maxLength="15"/>
          <button onClick={handleChange('enabled',task,updateTask,{toggle:true})} className={`ml-auto p-0.5 pl-1 text-sm flex flex-row items-center border border-${color}-500 rounded-full text-${color}-500 ${isMobile() ? `focus:outline-none focus:bg-transparent focus:text-${color}-500` : `hover:bg-${color}-500 hover:text-white`}`}>
            <p className={`mr-2`}>{task.enabled ? "Enabled" : "Disabled"}</p><FontAwesomeIcon icon={[task.enabled ? "fas" : "far",`${task.enabled ? "check" : "times"}-circle`]} size='lg' />
          </button>
          {taskError.taskname && <p className="text-red-500 text-sm">{taskError.taskname}</p>}
        </div>
        <div className="w-full flex flex-wrap flex-col lg:flex-row items-start lg:items-center">
          <div className="flex flex-row flex-wrap">
            {
              // <label className="mr-1">ID:</label>
              // <input className="bg-gray-800 rounded-md pl-1 text-base font-semibold" value={`${task.qrID || ''}`} onChange={handleChange('qrID',task,updateTask,7)} size="7" maxLength="7"/>
            }
            <label className="mr-1">Max completion time (sec): {task.maxTime || 20}</label>
            <input className="ml-auto" type="range" min="5" max="30" value={task.maxTime || 20} onChange={handleChange('maxTime',task,updateTask,{range:[5,30]})}/>
            {taskError.maxTime && <p className="text-red-500 text-sm">{taskError.maxTime}</p>}
          </div>
          <div className="flex flex-row flex-wrap items-center">
            <label className="mr-1">Task format:</label>
            <select className="bg-gray-800 rounded-md p-1" type="select" value={task.format || 'short'} onChange={handleChange('format',task,updateTask,{options:['short','common','long']})}>
              <option value="common">Common</option>
              <option value="short">Short</option>
              <option value="long">Long</option>
            </select>
            {taskError.format && <p className="text-red-500 text-sm">{taskError.format}</p>}
          </div>
          <div className="flex flex-row flex-wrap items-center">
            <input className="mr-1" type="checkbox" value={task.canBeNonVisual ? "true" : "false"} checked={task.canBeNonVisual} onChange={handleChange('canBeNonVisual',task,updateTask,{checked:true})} />
            <label className="">Can be non visual</label>
            {taskError.canBeNonVisual && <p className="text-red-500 text-sm">{taskError.canBeNonVisual}</p>}
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <button onClick={deleteTask} className={`ml-auto p-2 flex flex-row items-center border border-red-500 rounded-full text-red-500 ${isMobile() ? `focus:outline-none focus:border-none focus:bg-red-500 focus:text-white` : `hover:border-none hover:bg-red-500 hover:text-white`}`}>
          <p className={`hidden md:block mr-2`}>Delete</p><FontAwesomeIcon icon={['far','times-circle']} size='lg' />
        </button>
      </div>
    </div>
  );
};

const MobileTaskDescription = ({ task, selected, selectTask, unselectTask }) => {
  const color = useMemo(() => selected ? "green" : "red", [selected]);
  return (
    <div className="w-full py-2 first:pt-0 last:pb-0 flex flex-row items-center">
      <div className="w-full">
        <div className="w-full flex flex-wrap flex-row items-center justify-start">
          <p className="bg-transparent w-fit text-lg font-bold">{`${task.taskname || ''}`}</p>
          <p className="bg-transparent w-fit text-lg ml-1">{`${(task.format && `(${task.format})`) || ''}`}</p>
          {
            // <label className="mr-1">ID:</label>
            // <p className="bg-transparent w-fit text-base font-semibold">{`${task.qrID || ''}`}</p>
          }
        </div>
        <div className="w-full flex flex-wrap flex-row lg:flex-row items-start lg:items-center">

        </div>
      </div>
      <button onClick={selected ? unselectTask : selectTask} className={`ml-auto flex flex-row items-center rounded-full text-${color}-500 ${isMobile() ? `focus:outline-none focus:bg-transparent focus:text-${color}-500` : `hover:bg-${color}-500 hover:text-white`}`}>
        <FontAwesomeIcon icon={[selected ? 'fas' : 'far','check-circle']} size='2x' />
      </button>
    </div>
  );
};

export default UserTaskDescription;
export { MobileTaskDescription };
