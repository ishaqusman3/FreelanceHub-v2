import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaClock, FaMoneyBillWave } from 'react-icons/fa';

const MilestoneDefinitionForm = ({ totalBidAmount, onMilestonesChange, initialMilestones = [] }) => {
  const [milestones, setMilestones] = useState(
    initialMilestones.length > 0 
      ? initialMilestones 
      : [{ name: '', description: '', amount: '', duration: '' }]
  );

  const [errors, setErrors] = useState({});

  useEffect(() => {
    validateMilestones();
  }, [milestones, totalBidAmount]);

  const validateMilestones = () => {
    const newErrors = {};
    const total = getTotalAmount();
    
    if (total !== totalBidAmount) {
      newErrors.total = `Total milestone amounts must equal bid amount of ₦${totalBidAmount}`;
    }

    milestones.forEach((milestone, index) => {
      if (!milestone.name) newErrors[`${index}-name`] = 'Name is required';
      if (!milestone.description) newErrors[`${index}-description`] = 'Description is required';
      if (!milestone.amount) newErrors[`${index}-amount`] = 'Amount is required';
      if (!milestone.duration) newErrors[`${index}-duration`] = 'Duration is required';
      
      const duration = parseInt(milestone.duration);
      if (isNaN(duration) || duration < 1) {
        newErrors[`${index}-duration`] = 'Duration must be at least 1 week';
      }
    });

    setErrors(newErrors);
    onMilestonesChange(milestones, Object.keys(newErrors).length === 0);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { name: '', description: '', amount: '', duration: '' }]);
  };

  const removeMilestone = (index) => {
    const newMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(newMilestones);
  };

  const handleMilestoneChange = (index, field, value) => {
    const newMilestones = [...milestones];
    newMilestones[index] = { 
      ...newMilestones[index], 
      [field]: field === 'amount' || field === 'duration' ? parseFloat(value) || '' : value 
    };
    setMilestones(newMilestones);
  };

  const getTotalAmount = () => {
    return milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  };

  const getTotalDuration = () => {
    return milestones.reduce((sum, m) => sum + (parseInt(m.duration) || 0), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Define Milestones</h3>
        <div className="text-sm">
          <div className={`font-medium ${getTotalAmount() === totalBidAmount ? 'text-green-600' : 'text-red-600'}`}>
            Total Amount: ₦{getTotalAmount()} / ₦{totalBidAmount}
          </div>
          <div className="text-gray-600">
            Total Duration: {getTotalDuration()} weeks
          </div>
        </div>
      </div>

      {errors.total && (
        <div className="text-red-500 text-sm">{errors.total}</div>
      )}

      {milestones.map((milestone, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3 bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Milestone {index + 1}</h4>
            {milestones.length > 1 && (
              <button
                type="button"
                onClick={() => removeMilestone(index)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTrash />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <input
                type="text"
                placeholder="Milestone Name"
                value={milestone.name}
                onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                className={`w-full p-2 border rounded focus:ring-indigo-500 ${
                  errors[`${index}-name`] ? 'border-red-500' : ''
                }`}
              />
              {errors[`${index}-name`] && (
                <div className="text-red-500 text-sm mt-1">{errors[`${index}-name`]}</div>
              )}
            </div>
            
            <div>
              <textarea
                placeholder="Description"
                value={milestone.description}
                onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                className={`w-full p-2 border rounded focus:ring-indigo-500 ${
                  errors[`${index}-description`] ? 'border-red-500' : ''
                }`}
                rows="2"
              />
              {errors[`${index}-description`] && (
                <div className="text-red-500 text-sm mt-1">{errors[`${index}-description`]}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FaMoneyBillWave className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  placeholder="Amount (₦)"
                  value={milestone.amount}
                  onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                  className={`w-full pl-10 p-2 border rounded focus:ring-indigo-500 ${
                    errors[`${index}-amount`] ? 'border-red-500' : ''
                  }`}
                />
                {errors[`${index}-amount`] && (
                  <div className="text-red-500 text-sm mt-1">{errors[`${index}-amount`]}</div>
                )}
              </div>
              
              <div className="relative">
                <FaClock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  placeholder="Duration (weeks)"
                  value={milestone.duration}
                  min="1"
                  onChange={(e) => handleMilestoneChange(index, 'duration', e.target.value)}
                  className={`w-full pl-10 p-2 border rounded focus:ring-indigo-500 ${
                    errors[`${index}-duration`] ? 'border-red-500' : ''
                  }`}
                />
                {errors[`${index}-duration`] && (
                  <div className="text-red-500 text-sm mt-1">{errors[`${index}-duration`]}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addMilestone}
        className="w-full p-2 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-lg border-2 border-dashed border-indigo-200"
      >
        <FaPlus className="mr-2" />
        Add Milestone
      </button>
    </div>
  );
};

export default MilestoneDefinitionForm;