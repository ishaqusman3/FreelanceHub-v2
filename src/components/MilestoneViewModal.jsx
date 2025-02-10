import React from 'react';
import Modal from './Modal';

const MilestoneViewModal = ({ isOpen, onClose, milestones, userRole }) => {
  if (!milestones) return null; // Ensure milestones is defined

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-semibold mb-4">Milestones</h2>
      {milestones.length === 0 ? (
        <p>No milestones defined.</p>
      ) : (
        <ul>
          {milestones.map((milestone, index) => (
            <li key={`milestone-${index}`} className="mb-2">
              <h3 className="font-medium">{milestone.name}</h3>
              <p>{milestone.description}</p>
              <span className="text-gray-500">Due in {milestone.duration} weeks</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default MilestoneViewModal;
