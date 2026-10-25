import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isDestructive = true }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Confirm Action'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p style={{ fontSize: '13px', color: 'var(--color-text-main)', lineHeight: '1.6' }}>
        {message}
      </p>
    </Modal>
  );
}
