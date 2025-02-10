import React, { useState } from 'react';

export const MilestoneDefinitionModal = ({ onSubmit, totalAmount }) => {
  const [milestones, setMilestones] = useState([]);
  const [paymentMode, setPaymentMode] = useState('milestone'); // or 'completion'
  
  const handleSubmit = () => {
    onSubmit({
      milestones,
      paymentMode
    });
  };

  return (
    <div>
      <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
        <option value="milestone">Pay per Milestone</option>
        <option value="completion">Pay upon Completion</option> 
      </select>

      {paymentMode === 'milestone' && (
        <div>
          {/* Milestone input fields */}
          {milestones.map((milestone, index) => (
            <div key={index}>
              <input 
                type="text"
                placeholder="Milestone name"
                value={milestone.name}
                onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
              />
              <input
                type="number" 
                placeholder="Amount"
                value={milestone.amount}
                onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};