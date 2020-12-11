import React, { useMemo } from "react";
// import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isEmpty, isMobile, clamp } from 'utils';

const handleChange = (field, object, setter, constraint) => {
  return event => {
    let value = event.target.value;
    if (constraint && !isEmpty(constraint)) {
      const { maxLength, range, checked, options } = constraint;
      maxLength && (value = event.target.value.substring(0, maxLength));
      range && (value = clamp(event.target.value, range[0], range[1]));
      checked && (value = event.target.checked);
      options && (value = options.includes(value) ? value : options[0]);
    }
    event.target.value = value;
    setter({updateID:object.id, field, newValue: value});
  }
}

const UserTaskDescription = ({ task, errors, deleteTask, updateTask, ...props }) => {
  if (!isEmpty(props)) {
    console.error("PROPS NOT DESTRUCTURED", props);
  }
  // console.log(errors);
  const taskError = useMemo(() => errors || {}, [errors]);
  return (
    <div className="w-full py-2 first:pt-0 last:pb-0 flex flex-row items-center">
      <div className="w-full pr-2">
        <div className="w-full flex flex-wrap flex-row justify-start mb-1">
          <label className="mr-1 text-lg">Name:</label>
          <input className="bg-gray-800 rounded-md pl-1 text-lg font-bold" value={`${task.taskname || ''}`} onChange={handleChange('taskname',task,updateTask,{maxLength:15})} size="15" maxLength="15"/>
          {taskError.taskname && <p className="text-red-500 text-sm">{taskError.taskname}</p>}
        </div>
        <div className="w-full flex flex-wrap flex-col lg:flex-row items-start lg:items-center">
          <div className="flex flex-row flex-wrap">
            {
              // <label className="mr-1">ID:</label>
              // <input className="bg-gray-800 rounded-md pl-1 text-md font-semibold" value={`${task.qrID || ''}`} onChange={handleChange('qrID',task,updateTask,7)} size="7" maxLength="7"/>
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
      <button onClick={deleteTask} className="ml-auto p-2 flex flex-row items-center border border-red-500 rounded-full hover:border-none hover:bg-red-500 text-red-500 hover:text-white">
        <p className={`hidden md:block mr-2`}>Delete</p><FontAwesomeIcon icon={['far','times-circle']} size='lg' />
      </button>
    </div>
  );
};

const MobileTaskDescription = ({ task, selected, selectTask, unselectTask }) => {
  return (
    <div className="w-full py-2 first:pt-0 last:pb-0 flex flex-row items-center">
      <div className="w-full">
        <div className="w-full flex flex-wrap flex-row items-center justify-start">
          <p className="bg-transparent w-fit text-lg font-bold">{`${task.taskname || ''}`}</p>
          {
            // <label className="mr-1">ID:</label>
            // <p className="bg-transparent w-fit text-md font-semibold">{`${task.qrID || ''}`}</p>
          }
        </div>
        <div className="w-full flex flex-wrap flex-row lg:flex-row items-start lg:items-center">

        </div>
      </div>
      <button onClick={selected ? unselectTask : selectTask} className={`ml-auto flex flex-row items-center rounded-full hover:bg-red-500 text-red-500 hover:text-white ${isMobile() && "focus:outline-none focus:bg-transparent focus:text-red-500"}`}>
        <FontAwesomeIcon icon={[selected ? 'fas' : 'far','check-circle']} size='2x' />
      </button>
    </div>
  );
};

export default UserTaskDescription;
export { MobileTaskDescription };
