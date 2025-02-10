import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const TransactionHistory = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const transactionsRef = collection(db, 'transactions');
        const q = query(
          transactionsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const transactionsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTransactions(transactionsList);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h3 className="text-xl font-bold mb-4">Transaction History</h3>
      {transactions.length === 0 ? (
        <p className="text-gray-500">No transactions yet</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                {transaction.type === 'deposit' ? (
                  <FaArrowDown className="text-green-500 mr-3" />
                ) : (
                  <FaArrowUp className="text-red-500 mr-3" />
                )}
                <div>
                  <p className="font-medium">{transaction.type}</p>
                  <p className="text-sm text-gray-500">
                    {transaction.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
              </div>
              <div className={`font-bold ${
                transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'
              }`}>
                {transaction.type === 'deposit' ? '+' : '-'}₦{Math.abs(transaction.amount).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory; 