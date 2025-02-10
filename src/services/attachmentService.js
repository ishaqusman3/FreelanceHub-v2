import { storage, db } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { createActivity } from './activityService';
import { sendNotification } from './notificationService';

export const uploadMilestoneAttachment = async (jobId, milestoneId, file, uploaderId) => {
  try {
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const filePath = `jobs/${jobId}/milestones/${milestoneId}/attachments/${fileId}.${fileExtension}`;
    const storageRef = ref(storage, filePath);

    // Upload file to Firebase Storage
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Create attachment metadata
    const attachmentData = {
      id: fileId,
      name: file.name,
      url: downloadURL,
      type: file.type,
      size: file.size,
      uploadedBy: uploaderId,
      uploadedAt: serverTimestamp()
    };

    // Update milestone document with attachment
    const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);
    await updateDoc(milestoneRef, {
      attachments: arrayUnion(attachmentData),
      lastUpdated: serverTimestamp()
    });

    // Create activity record
    await createActivity({
      userId: uploaderId,
      type: 'upload_attachment',
      text: `Uploaded file "${file.name}" to milestone`,
      icon: '📎',
      jobId,
      milestoneId,
      attachmentId: fileId
    });

    // Send notification to relevant parties
    await sendNotification({
      type: 'milestone_attachment',
      title: 'New Milestone Attachment',
      message: `A new file "${file.name}" has been uploaded to the milestone`,
      jobId,
      milestoneId,
      attachmentId: fileId,
      icon: '📎'
    });

    return attachmentData;
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};

export const deleteMilestoneAttachment = async (jobId, milestoneId, attachmentId, userId) => {
  try {
    const milestoneRef = doc(db, `jobs/${jobId}/milestones/${milestoneId}`);
    
    // Remove the attachment from Storage
    const storageRef = ref(storage, `jobs/${jobId}/milestones/${milestoneId}/attachments/${attachmentId}`);
    await deleteObject(storageRef);

    // Update milestone document
    await updateDoc(milestoneRef, {
      attachments: arrayRemove({ id: attachmentId }),
      lastUpdated: serverTimestamp()
    });

    // Create activity record
    await createActivity({
      userId,
      type: 'delete_attachment',
      text: 'Deleted attachment from milestone',
      icon: '🗑️',
      jobId,
      milestoneId,
      attachmentId
    });

    return true;
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
};

export const getAttachments = async (jobId, milestoneId) => {
  try {
    const milestoneDoc = await getDoc(doc(db, `jobs/${jobId}/milestones/${milestoneId}`));
    return milestoneDoc.data()?.attachments || [];
  } catch (error) {
    console.error('Error getting attachments:', error);
    throw error;
  }
};
