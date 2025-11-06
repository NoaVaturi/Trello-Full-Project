import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";


const API_URL = process.env.REACT_APP_API_URL;

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [editCard, setEditCard] = useState(null);
  const [showCardAddModal, setShowCardAddModal] = useState(false);
  const [modalListId, setModalListId] = useState(null);
  const [modalListTitle, setModalListTitle] = useState("");
  // State to hold the ID of the board (main or sub-board) to which the list belongs
  const [modalParentBoardId, setModalParentBoardId] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [viewBoards, setViewBoards] = useState(true);
  const [subBoard, setSubBoard] = useState(null);
  const [loading, setLoading] = useState(false);

  // Custom Message Box State
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // State for custom drag-and-drop for cards
  const [draggingCard, setDraggingCard] = useState(null); // { id, originalListId, originalIndex }
  const [dragOverTarget, setDragOverTarget] = useState(null); // { listId, cardIndex }
  const dragGhostRef = useRef(null); // Ref for the drag ghost element

  // State for list drag-and-drop
  const [draggingList, setDraggingList] = useState(null); // { id, originalIndex }
  const [dragOverListTarget, setDragOverListTarget] = useState(null); // { index }

  // State to force re-render of board content after updates
  const [boardUpdateKey, setBoardUpdateKey] = useState(0);


  // --- Helper Functions (defined within App component) ---

  // Function to display messages
  const showMessage = useCallback((msg, type = 'info', duration = 3000) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, duration);
  }, []);

  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoards(res.data);
    } catch (error) {
      console.error("Error fetching boards:", error);
      showMessage("Failed to fetch boards. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showMessage]);

  useEffect(() => {
    if (token) fetchBoards();
  }, [token, fetchBoards]);

  const fetchBoard = useCallback(async (boardId) => {
    try {
      setLoading(true);
      console.log("Fetching board:", boardId);
      const res = await axios.get(`${API_URL}/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { t: new Date().getTime() }, // force cache bypass
      });

      // Directly modify res.data.lists and its cards for sorting
      res.data.lists.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      res.data.lists.forEach((list) => {
        list.cards.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      });

      // Set the entire new data object to trigger re-render
      setCurrentBoard(res.data);
      setViewBoards(false);
      setBoardUpdateKey(prev => prev + 1); // Increment key to force re-render
      console.log("Board loaded:", res.data);
    } catch (error) {
      console.error("Error fetching board:", error);
      showMessage("Failed to load board. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showMessage]);


  const fetchSubBoard = useCallback(async (subBoardId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/boards/${subBoardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Directly modify res.data.lists and its cards for sorting
      res.data.lists.sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
      res.data.lists.forEach((list) => {
        list.cards.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      });

      console.log("Fetched subboard:", res.data);
      // Set the entire new data object to trigger re-render
      setSubBoard(res.data);
      setBoardUpdateKey(prev => prev + 1); // Increment key to force re-render
    } catch (error) {
      console.error("Error fetching sub-board:", error);
      showMessage("Failed to fetch project board. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  }, [token, showMessage]);

  const handleAuth = async () => {
    const endpoint = authMode === "signup" ? "/signup" : "/login";
    try {
      const res = await axios.post(
        `${API_URL}${endpoint}`,
        { username, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch (error) {
      console.error("Authentication failed:", error);
      if (error.response) {
        const backendMessage =
          error.response.data.message || "Authentication failed.";
        showMessage(backendMessage, 'error');
      } else {
        showMessage("Network error or server unavailable. Please try again.", 'error');
      }
    }
  };

  const addBoard = async () => {
    const name = window.prompt("Enter board name:"); // Using window.prompt for simplicity
    if (!name) return;
    try {
      await axios.post(
        `${API_URL}/boards`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBoards();
      showMessage("Board added successfully!", 'success');
    } catch (error) {
      console.error("Failed to add board:", error);
      showMessage("Failed to add board. Please try again.", 'error');
    }
  };

  const addList = async (boardId) => {
    const title = window.prompt("Enter list title:"); // Using window.prompt for simplicity
    if (!title || !boardId) return;
    try {
      await axios.post(
        `${API_URL}/boards/${boardId}/lists`,
        { title: title.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (currentBoard && currentBoard._id === boardId) {
        fetchBoard(boardId);
      } else if (subBoard && subBoard._id === boardId) {
        fetchSubBoard(boardId);
      }
      showMessage("List added successfully!", 'success');
    } catch (error) {
      console.error("Failed to add list:", error);
      showMessage("Failed to add list. Please try again.", 'error');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to delete this card?")) return; // Using window.confirm
    try {
      await axios.delete(`${API_URL}/cards/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Determine which board to refetch based on current context
      if (subBoard && subBoard._id) { // Ensure subBoard._id is defined
        fetchSubBoard(subBoard._id); // Refresh the sub-board
        if (currentBoard && currentBoard._id) { // Ensure currentBoard._id is defined
          fetchBoard(currentBoard._id); // Also refresh the main board to update project card progress
        }
      } else if (currentBoard && currentBoard._id) { // Ensure currentBoard._id is defined
        fetchBoard(currentBoard._id);
      }
      showMessage("Card deleted successfully!", 'success');
    } catch (error) {
      console.error("Error deleting card:", error);
      showMessage("Failed to delete card. Please try again.", 'error');
    }
  };

  const handleDeleteList = async (listId, boardId) => {
    if (!window.confirm("Are you sure you want to delete this list?")) return; // Using window.confirm
    try {
      await axios.delete(`${API_URL}/lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Determine which board to refetch based on current context
      if (currentBoard && currentBoard._id === boardId) {
        fetchBoard(boardId);
      } else if (subBoard && subBoard._id === boardId) {
        fetchSubBoard(boardId);
      }
      showMessage("List deleted successfully!", 'success');
    } catch (error) {
      console.error("Error deleting list:", error);
      showMessage("Failed to delete list. Please try again.", 'error');
    }
  };

  const handleRenameList = async (listId, boardId) => {
    const newTitle = window.prompt("Enter new list title:"); // Using window.prompt
    if (!newTitle) return;
    try {
      await axios.patch(
        `${API_URL}/lists/${listId}`,
        { title: newTitle.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (currentBoard && currentBoard._id === boardId) {
        fetchBoard(boardId);
      } else if (subBoard && subBoard._id === boardId) {
        fetchSubBoard(boardId);
      }
      showMessage("List renamed successfully!", 'success');
    } catch (error) {
      console.error("Error renaming list:", error);
      showMessage("Failed to rename list. Please try again.", 'error');
    }
  };

  // --- Custom Drag and Drop Handlers for Cards ---
  const handleCardDragStart = useCallback((e, card, listId, cardIndex) => {
    e.stopPropagation(); // Prevent parent elements from also starting a drag
    setDraggingCard({ id: card._id, originalListId: listId, originalIndex: cardIndex });

    // Create a custom drag image (ghost)
    const ghost = e.currentTarget.cloneNode(true);
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px'; // Move off-screen
    ghost.style.left = '-1000px';
    ghost.style.width = e.currentTarget.offsetWidth + 'px';
    ghost.style.height = e.currentTarget.offsetHeight + 'px';
    ghost.style.opacity = '0.7';
    ghost.style.pointerEvents = 'none'; // Ensure it doesn't interfere
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;

    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleCardDragOver = useCallback((e, listId, cardIndex) => {
    e.preventDefault(); // Allow drop
    if (draggingCard) {
      setDragOverTarget({ listId, cardIndex });
      // console.log(`DRAG OVER CARD: List ID: ${listId}, Card Index: ${cardIndex}`); // Debugging log
    }
  }, [draggingCard]);

  // Removed handleListDropAreaDragOver as its logic is integrated into the main list's onDragOver

  const handleDragEnd = useCallback(async (e, isSubBoardDrag) => {
    e.preventDefault(); // Prevent default browser drag end behavior

    // Clean up the ghost element
    if (dragGhostRef.current) {
      document.body.removeChild(dragGhostRef.current);
      dragGhostRef.current = null;
    }

    if (!draggingCard || !dragOverTarget) {
      // console.log("Drag ended without valid draggingCard or dragOverTarget."); // Debugging log
      setDraggingCard(null);
      setDragOverTarget(null);
      return;
    }

    const { id: draggableId, originalListId, originalIndex } = draggingCard;
    const { listId: destinationListId, cardIndex: destinationIndex } = dragOverTarget;

    // console.log(`DRAG END: Card ${draggableId} from list ${originalListId} (idx ${originalIndex}) to list ${destinationListId} (idx ${destinationIndex})`); // Debugging log

    // Reset card drag state
    setDraggingCard(null);
    setDragOverTarget(null);

    // If dropped back into the same place without change, do nothing
    if (originalListId === destinationListId && originalIndex === destinationIndex) {
      // console.log("Dropped back to original position."); // Debugging log
      return;
    }

    // Determine which board state to update and which fetch function to call
    const currentBoardState = isSubBoardDrag ? subBoard : currentBoard;
    const setCurrentBoardState = isSubBoardDrag ? setSubBoard : setCurrentBoard;

    // Store the original state for potential rollback (optimistic update)
    const originalState = JSON.parse(JSON.stringify(currentBoardState));

    setCurrentBoardState((prevBoardState) => {
      // Create deep copies for immutability
      const newLists = prevBoardState.lists.map(list => ({
        ...list,
        cards: [...list.cards]
      }));

      const sourceList = newLists.find(l => l._id === originalListId);
      const destList = newLists.find(l => l._id === destinationListId);

      if (!sourceList || !destList) {
        console.error("Source or destination list not found during card drag.");
        return prevBoardState;
      }

      // Find the card to move
      const movedCard = sourceList.cards.find(card => card._id === draggableId);
      if (!movedCard) {
          console.error("Dragged card not found in source list.");
          return prevBoardState;
      }

      // Remove the card from the source list
      sourceList.cards = sourceList.cards.filter(card => card._id !== draggableId);

      // Add the card to the destination list at the correct index
      // destinationIndex is the index *before which* the card should be inserted.
      destList.cards.splice(destinationIndex, 0, movedCard);

      // Update positions for cards in the destination list
      destList.cards = destList.cards.map((card, idx) => ({
        ...card,
        position: idx,
      }));

      // If moved to a different list, update positions in the source list too
      if (originalListId !== destinationListId) {
        sourceList.cards = sourceList.cards.map((card, idx) => ({
          ...card,
          position: idx,
        }));
      }

      return { ...prevBoardState, lists: newLists };
    });

    try {
      await axios.patch(
        `${API_URL}/cards/${draggableId}/reorder`,
        {
          new_position: destinationIndex, // Send the calculated destination index to backend
          new_list_id: destinationListId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showMessage('Card reordered successfully!', 'success');

      // After successful card reorder, ensure relevant boards are re-fetched
      if (subBoard && subBoard._id) { // If currently viewing a sub-board
          await fetchSubBoard(subBoard._id);
          if (currentBoard && currentBoard._id) { // And there's a main board
              await fetchBoard(currentBoard._id); // Refresh main board for project card progress
          }
      } else if (currentBoard && currentBoard._id) { // If currently viewing the main board
          await fetchBoard(currentBoard._id);
      }

    } catch (error) {
      console.error("Error updating card position:", error);
      showMessage("Failed to reorder card. Reverting.", 'error');
      setCurrentBoardState(originalState); // Revert UI on error
      // Re-fetch to ensure consistency if an error occurred
      if (isSubBoardDrag && subBoard?._id) {
        fetchSubBoard(subBoard._id);
        if (currentBoard?._id) {
          fetchBoard(currentBoard._id);
        }
      } else if (currentBoard?._id) {
        fetchBoard(currentBoard._id);
      }
    }
  }, [draggingCard, dragOverTarget, token, currentBoard, subBoard, fetchBoard, fetchSubBoard, showMessage]);


  // Helper to determine if a card is being dragged over a specific position
  const isDragOverPosition = useCallback((listId, cardIndex) => {
    return draggingCard &&
           dragOverTarget &&
           dragOverTarget.listId === listId &&
           dragOverTarget.cardIndex === cardIndex;
  }, [draggingCard, dragOverTarget]);


  // --- Custom Drag and Drop Handlers for Lists ---
  const handleListDragStart = useCallback((e, listId, listIndex) => {
    setDraggingList({ id: listId, originalIndex: listIndex });
    // Optional: Create a custom drag image for the list
    const ghost = e.currentTarget.cloneNode(true);
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.left = '-1000px';
    ghost.style.width = e.currentTarget.offsetWidth + 'px';
    ghost.style.opacity = '0.7';
    ghost.style.pointerEvents = 'none';
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleListDragOver = useCallback((e, listIndex) => {
    e.preventDefault(); // Allow drop
    if (draggingList) {
      setDragOverListTarget({ index: listIndex });
    }
  }, [draggingList]);

  const handleListDrop = useCallback(async (e, destinationIndex) => {
    e.preventDefault();
    if (dragGhostRef.current) {
      document.body.removeChild(dragGhostRef.current);
      dragGhostRef.current = null;
    }

    if (!draggingList || dragOverListTarget === null) {
      setDraggingList(null);
      setDragOverListTarget(null);
      return;
    }

    const { id: draggedListId, originalIndex } = draggingList;
    const { index: newIndex } = dragOverListTarget;

    // Reset list drag state
    setDraggingList(null);
    setDragOverListTarget(null);

    if (originalIndex === newIndex) {
      return; // No change in position
    }

    const currentBoardState = subBoard || currentBoard;
    const setCurrentBoardState = subBoard ? setSubBoard : setCurrentBoard;
    const boardIdToFetch = subBoard?._id || currentBoard?._id;
    const fetchBoardFunction = subBoard ? fetchSubBoard : fetchBoard;

    const originalLists = currentBoardState.lists;
    const newLists = Array.from(originalLists);
    const [movedList] = newLists.splice(originalIndex, 1);
    newLists.splice(newIndex, 0, movedList);

    // Optimistic UI update
    setCurrentBoardState((prev) => ({ ...prev, lists: newLists }));

    try {
      const reorderedListIds = newLists.map(list => list._id);
      await axios.patch(
        `${API_URL}/lists/reorder`,
        { reorderedListIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('Lists reordered successfully!', 'success');
      // After successful list reorder, force a re-render of the board
      if (boardIdToFetch) {
        fetchBoardFunction(boardIdToFetch);
      }
    } catch (error) {
      console.error("Error reordering lists:", error);
      showMessage("Failed to reorder lists. Reverting.", 'error');
      setCurrentBoardState((prev) => ({ ...prev, lists: originalLists })); // Revert UI
      if (boardIdToFetch) {
        fetchBoardFunction(boardIdToFetch); // Re-fetch to ensure consistency
      }
    }
  }, [draggingList, dragOverListTarget, token, currentBoard, subBoard, fetchBoard, fetchSubBoard, showMessage]);

  // Helper to determine if a list is being dragged over a specific position
  const isListDragOverPosition = useCallback((listIndex) => {
    return draggingList && dragOverListTarget && dragOverListTarget.index === listIndex;
  }, [draggingList, dragOverListTarget]);


  // Function to handle user logout
  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  // --- Inline Component Definitions (moved inside App for scope) ---

  // Inline SVG Icons
  const PlusIcon = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );

  const PencilIcon = ({ className = "", onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" onClick={onClick}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const TrashIcon = ({ className = "", onClick }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" onClick={onClick}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const GithubIcon = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`inline-block h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.499.09.679-.217.679-.481 0-.237-.008-.862-.013-1.693-2.782.602-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.618.069-.606.069-.606 1.003.07 1.531 1.032 1.531 1.032.892 1.529 2.341 1.089 2.91.835.09-.647.35-1.089.636-1.338-2.22-.253-4.555-1.113-4.555-4.953 0-1.096.391-1.994 1.029-2.697-.103-.253-.446-1.275.097-2.652 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.7.115 2.5.336 1.909-1.296 2.747-1.025 2.747-1.025.546 1.377.202 2.398.099 2.652.64.703 1.028 1.601 1.028 2.697 0 3.848-2.339 4.695-4.566 4.943.359.309.678.917.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.579.688.481C21.137 20.19 24 16.425 24 12.017 24 6.484 19.522 2 14 2h-2z" clipRule="evenodd" />
    </svg>
  );

  // CardEditModal Component
  const CardEditModal = ({ card, onClose, onSave }) => {
    const [title, setTitle] = useState(card.title);
    const [githubUrl, setGithubUrl] = useState(card.githubUrl || "");
    const [progress, setProgress] = useState(card.progress || 0);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave({ title, githubUrl, progress });
    };

    // Determine if GitHub URL field should be shown
    const showGithubUrlField = card.type === "project-card";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Edit Card</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="card-title" className="block text-gray-700 text-sm font-bold mb-2">
                Title:
              </label>
              <input
                type="text"
                id="card-title"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            {/* Conditional rendering for GitHub URL based on card type */}
            {showGithubUrlField && (
              <div className="mb-4">
                <label htmlFor="github-url" className="block text-gray-700 text-sm font-bold mb-2">
                  GitHub URL:
                </label>
                <input
                  type="url"
                  id="github-url"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
            )}
            {card.type === "project-card" && (
              <div className="mb-4">
                <label htmlFor="progress" className="block text-gray-700 text-sm font-bold mb-2">
                  Progress (%):
                </label>
                <input
                  type="number"
                  id="progress"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // CardAddModal Component
  const CardAddModal = ({ isOpen, onClose, listTitle, onSubmit, parentBoardId }) => {
    const [title, setTitle] = useState("");
    const [githubUrl, setGithubUrl] = useState("");

    useEffect(() => {
      if (!isOpen) {
        setTitle("");
        setGithubUrl("");
      }
    }, [isOpen]);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ title, githubUrl, parentBoardId }); // Pass parentBoardId to onSubmit
    };

    if (!isOpen) return null;

    // Determine if GitHub URL field should be shown
    const showGithubUrlField = listTitle === "Projects"; // Only for "Projects" list

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Add Card to "{listTitle}"</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="new-card-title" className="block text-gray-700 text-sm font-bold mb-2">
                Card Title:
              </label>
              <textarea // Changed from input to textarea
                id="new-card-title"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows="3" // Added rows attribute for initial height
                required
              ></textarea>
            </div>
            {/* Conditional rendering for GitHub URL based on showGithubUrlField */}
            {showGithubUrlField && (
              <div className="mb-4">
                <label htmlFor="new-github-url" className="block text-gray-700 text-sm font-bold mb-2">
                  GitHub URL (Optional):
                </label>
                <input
                  type="url"
                  id="new-github-url"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Add Card
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ListHeader Component
  const ListHeader = ({ listTitle, onDelete, onRename }) => (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-gray-800">{listTitle}</h3>
      <div className="flex space-x-2">
        <PencilIcon
          className="text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
          onClick={onRename}
        />
        <TrashIcon
          className="text-gray-400 hover:text-red-500 cursor-pointer text-xs"
          onClick={onDelete}
        />
      </div>
    </div>
  );

  // CardItem Component
  const CardItem = React.memo(({ card, onEdit, onDelete, isDragging }) => (
    <div
      className={`bg-white rounded-lg p-3 mb-2 shadow-sm border border-gray-200 flex flex-col transition-all duration-150 ease-in-out hover:shadow-md cursor-grab ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-sm font-normal block break-words">
            {card.title}
          </span>
          {card.githubUrl && (
            <a
              href={card.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-xs hover:underline flex items-center mt-1"
              onClick={(e) => e.stopPropagation()} // Stop propagation here
            >
              <GithubIcon className="inline-block mr-1" /> GitHub
            </a>
          )}
        </div>
        <div className="flex space-x-1">
          <PencilIcon
            // Added hover classes for consistency
            className="text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
          />
          <TrashIcon
            // Added hover classes for consistency
            className="text-gray-400 hover:text-red-500 cursor-pointer text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card._id);
            }}
          />
        </div>
      </div>
      {card.type === "project-card" && card.progress !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 flex items-center">
          <div
            // Changed from blue-400 to green-500 for progress bar
            className="bg-green-500 h-2.5 rounded-full"
            style={{ width: `${card.progress}%` }}
          ></div>
          {/* Progress percentage text */}
          <span className="ml-2 text-xs font-medium text-gray-700">
            {card.progress}%
          </span>
        </div>
      )}
    </div>
  ));

  // Custom Message Box Component
  const MessageBox = ({ message, type, onClose }) => {
    if (!message) return null;

    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';

    return (
      <div className="fixed top-4 right-4 p-2 rounded-lg shadow-lg z-50 animate-fade-in-down" style={{ animationDuration: '0.5s' }}>
        <div className={`${bgColor} text-white px-4 py-2 rounded-lg flex items-center justify-between`}>
          <span>{message}</span>
          <button onClick={onClose} className="ml-4 text-white font-bold text-xl leading-none">&times;</button>
        </div>
      </div>
    );
  };

  // AddCardButton Component
  const AddCardButton = ({ onClick }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center text-sm text-gray-700 hover:bg-gray-200 rounded px-2 py-1 w-full transition shadow-sm hover:shadow"
    >
      <PlusIcon className="mr-1 text-gray-500" /> Add a card
    </button>
  );

  // Define handleCardAddSubmit using useCallback to ensure it captures latest state
  const handleCardAddSubmit = useCallback(async ({ title, githubUrl, parentBoardId }) => {
    try {
      const payload = {
        title: title.trim(),
        githubUrl: modalListTitle === "Projects" ? githubUrl.trim() : "",
        type: modalListTitle === "Projects" ? "project-card" : "card",
      };
      console.log("Payload being sent:", payload);
      await axios.post(`${API_URL}/lists/${modalListId}/cards`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCardAddModal(false);

      // Refresh logic: prioritize subBoard refresh if present, then main board
      if (subBoard && subBoard._id) {
          await fetchSubBoard(subBoard._id); // Ensure sub-board is refreshed first
          if (currentBoard && currentBoard._id) {
              await fetchBoard(currentBoard._id); // Then refresh main board for project card progress
          }
      } else if (currentBoard && currentBoard._id) {
          await fetchBoard(currentBoard._id); // Only refresh main board if no sub-board
      } else {
          console.error("Could not determine board to refresh after card add.");
      }
      showMessage("Card added successfully!", 'success');
    } catch (error) {
      console.error("Error adding card:", error);
      showMessage("Failed to add card.", 'error');
    }
  }, [modalListTitle, modalListId, token, showMessage, subBoard, currentBoard, fetchSubBoard, fetchBoard]);


  // The main App component's render logic
  return (
    <div className="relative min-h-screen w-full">
      {/* Embedded CSS Styles (from App.css) */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            margin: 0;
            font-family: 'Inter', sans-serif; /* Changed from Segoe UI to Inter for consistency */
            background: #f4f5f7;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }

          html, body {
            height: 100%;
          }

          .animate-fade-in-down {
            animation: fadeInDown 0.5s ease-out forwards;
          }
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Trello-like list styling */
          .list-container {
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }

          .list-inner {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .list { /* This might be overridden by Tailwind classes in JSX */
            background: #ebecf0;
            border-radius: 8px;
            padding: 10px;
            width: 280px;
            flex-shrink: 0;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            margin-right: 1rem;
            max-height: 90vh;
            overflow-y: auto;
          }

          .list h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1rem;
          }

          /* Card styling */
          .card {
            background: white;
            border-radius: 0.5rem; /* rounded-lg */
            padding: 0.75rem; /* p-3 */
            margin-bottom: 0.5rem; /* mb-2 */
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
            border: 1px solid #e2e8f0; /* border border-gray-200 */
            display: flex;
            flex-direction: column;
            transition: background-color 0.2s ease, box-shadow 0.15s ease-in-out; /* Added box-shadow transition */
            cursor: grab; /* Consistent with custom D&D */
            word-wrap: break-word;
            overflow-wrap: break-word;
            white-space: normal;
          }

          .card:hover {
            background: #f4f5f7;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* hover:shadow-md */
          }

          .add-card input { /* Not directly used, Tailwind handles this */
            flex: 1;
            padding: 6px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }

          .add-card button { /* Not directly used, Tailwind handles this */
            padding: 6px 12px;
            background: #5aac44;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }

          /* Progress bar styling */
          .progress-bar-container {
            background: #e0e0e0; /* gray-200 */
            border-radius: 4px; /* rounded-full */
            overflow: hidden;
            height: 6px; /* h-2.5 */
            margin-top: 4px; /* mt-2 */
          }

          .progress-bar-fill {
            background: #22c55e; /* Changed to green-500 */
            height: 100%;
            width: 0%;
            transition: width 0.3s;
          }

          /* GitHub link styling */
          .github-link {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 0.8rem;
            color: #0969da;
            margin-top: 4px;
            text-decoration: none;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }

          .github-link:hover {
            text-decoration: underline;
          }

          img[alt="bg"] {
            pointer-events: none;
          }

          *, *::before, *::after {
            box-sizing: border-box;
          }

          /* Custom drag-over indicator for cards */
          .drag-over-indicator {
            height: 4px;
            background-color: #3b82f6; /* blue-500 */
            border-radius: 2px;
            margin: 4px 0;
            animation: pulse 1s infinite alternate;
          }
          /* Custom drag-over indicator for lists */
          .list-drag-over-indicator {
            width: 280px; /* Match list width */
            height: 4px;
            background-color: #3b82f6; /* blue-500 */
            border-radius: 2px;
            margin: 0 0 1rem 0; /* Adjust margin to sit between lists */
            animation: pulse 1s infinite alternate;
          }
          @keyframes pulse {
            from { opacity: 0.6; }
            to { opacity: 1; }
          }
        `}
      </style>

      {/* Conditionally render main content based on token and viewBoards state */}
      {!token ? (
        // Authentication UI (Login/Signup)
        <div
          className="flex justify-center items-center h-screen bg-cover bg-center"
          style={{ backgroundImage: "url('/pexels-suissounet-2101187.jpg')" }}
        >
          <div className="bg-white p-6 rounded shadow text-center w-80">
            <h2 className="text-lg mb-4 font-semibold">
              {authMode === "signup" ? "Sign Up to Trello App" : "Login to Trello App"}
            </h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-2 mb-2 w-full rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 mb-4 w-full rounded"
            />
            <button
              onClick={handleAuth}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-2"
            >
              {authMode === "signup" ? "Sign Up" : "Login"}
            </button>
            <button
              onClick={() =>
                setAuthMode(authMode === "signup" ? "login" : "signup")
              }
              className="text-blue-500 text-sm"
            >
              {authMode === "signup"
                ? "Already have an account? Login"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      ) : viewBoards ? (
        // Board List UI
        <div
          className="min-h-screen flex flex-col justify-center items-center bg-cover bg-center p-8"
          style={{ backgroundImage: "url('/pexels-suissounet-2101187.jpg')" }}
        >
          <button
            onClick={logout}
            className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded shadow"
          >
            Logout
          </button>
          <h1 className="text-white text-3xl font-semibold mb-6" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)' }}>Your Boards</h1>
          <div className="flex gap-4 flex-wrap justify-center">
            {boards.map((board) => (
              <div
                key={board._id}
                onClick={() => fetchBoard(board._id)}
                className="bg-white bg-opacity-90 p-4 rounded-lg shadow w-60 text-center cursor-pointer transform transition hover:-translate-y-1 hover:shadow-md"
              >
                <h2 className="text-lg font-semibold">{board.title}</h2>
              </div>
            ))}
          </div>
          <button
            onClick={addBoard}
            className="mt-6 bg-blue-500 text-white px-4 py-2 rounded shadow hover:shadow-md transition flex items-center"
          >
            <PlusIcon className="mr-2" /> Add Board
          </button>
        </div>
      ) : currentBoard && !subBoard ? (
        // Main Board View
        <div
          key={`main-board-${boardUpdateKey}`} // Key to force re-render
          className="relative min-h-screen w-full"
        >
          {/* Dynamic background */}
          {currentBoard?.title === "Personal" ? (
            <img
              src="/pexels-nietjuhart-776656.jpg"
              className="absolute inset-0 w-full h-full object-cover"
              alt="bg"
            />
          ) : currentBoard?.title === "Work" ? (
            <img
              src="/pexels-lum3n-44775-399161.jpg"
              className="absolute inset-0 w-full h-full object-cover"
              alt="bg"
            />
          ) : (
            <img
              src="/pexels-suissounet-2101187.jpg"
              className="absolute inset-0 w-full h-full object-cover"
              alt="bg"
            />
          )}

          {/* Navigation buttons */}
          <button
            onClick={logout}
            className="fixed top-4 right-4 bg-red-500 text-white px-3 py-1 rounded shadow"
          >
            Logout
          </button>
          <button
            onClick={() => setViewBoards(true)}
            className="fixed top-4 left-4 bg-gray-700 text-white px-3 py-1 rounded shadow"
          >
            ← Back to Boards
          </button>

          {/* Main content with horizontal draggable lists */}
          <div
            className="relative p-4 mt-16 flex overflow-x-auto space-x-4 items-start"
            onDragEnd={(e) => {
              handleDragEnd(e, false); // Card drag end
              handleListDrop(e, dragOverListTarget?.index); // List drag end
            }}
          >
            {currentBoard.lists
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((list, listIndex) => (
                <React.Fragment key={list._id}>
                  {isListDragOverPosition(listIndex) && (
                    <div className="list-drag-over-indicator"></div>
                  )}
                  <div
                    draggable="true"
                    onDragStart={(e) => handleListDragStart(e, list._id, listIndex)}
                    onDragOver={(e) => {
                      e.preventDefault(); // Allow drop for both lists and cards
                      if (draggingList) {
                        handleListDragOver(e, listIndex); // For list reordering
                      } else if (draggingCard) {
                        // If the drag is over the list container itself (not a child card)
                        // This implies dropping at the end of the list.
                        if (e.currentTarget === e.target) {
                          setDragOverTarget({ listId: list._id, cardIndex: list.cards.length });
                        }
                        // Note: handleCardDragOver will be called by individual cards
                        // if the drag is over them.
                      }
                    }}
                    onDrop={(e) => {
                      // This drop handler will be called if the drop occurs on the list container itself,
                      // not directly on a card. This means drop at the end.
                      // The handleDragEnd will use the last set dragOverTarget.
                      if (draggingList) {
                        handleListDrop(e, listIndex);
                      } else if (draggingCard) {
                        handleDragEnd(e, false); // Pass isSubBoardDrag based on context
                      }
                    }}
                    className="bg-gray-100 p-4 rounded mb-4 w-[280px] flex-shrink-0"
                  >
                    <ListHeader
                      listTitle={list.title}
                      onDelete={() => handleDeleteList(list._id, currentBoard._id)}
                      onRename={() => handleRenameList(list._id, currentBoard._id)}
                    />

                    {/* Inner Droppable area for cards */}
                    <div
                      className="min-h-[50px]"
                      // Removed onDragOver from here, let the parent handle general list drops
                      onDrop={(e) => handleDragEnd(e, false)} // Keep onDrop here for cards dropped directly on this area
                    >
                      {list.cards
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map((card, index) => (
                          <React.Fragment key={card._id}>
                            {isDragOverPosition(list._id, index) && (
                              <div className="drag-over-indicator"></div>
                            )}
                            <div
                              draggable="true"
                              onDragStart={(e) => handleCardDragStart(e, card, list._id, index)}
                              onDragOver={(e) => handleCardDragOver(e, list._id, index)} // Keep this for specific card drops
                              onDrop={(e) => handleDragEnd(e, false)}
                              onClick={() => {
                                if (card.type === "project-card" && card.subBoardId) {
                                  fetchSubBoard(card.subBoardId);
                                }
                              }}
                            >
                              <CardItem
                                card={card}
                                onEdit={setEditCard}
                                onDelete={handleDeleteCard}
                                isDragging={draggingCard && draggingCard.id === card._id}
                              />
                            </div>
                          </React.Fragment>
                        ))}
                      {/* Placeholder for dropping at the end of a list (now handled by parent onDragOver) */}
                      {draggingCard && dragOverTarget && dragOverTarget.listId === list._id &&
                       dragOverTarget.cardIndex === list.cards.length && list.cards.length > 0 && (
                        <div className="drag-over-indicator"></div>
                      )}
                      {/* Empty list drop area visual cue */}
                      {list.cards.length === 0 && draggingCard && dragOverTarget && dragOverTarget.listId === list._id && (
                        <div className="min-h-[50px] border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                          Drop cards here
                        </div>
                      )}
                      <AddCardButton
                        onClick={() => {
                          setModalListId(list._id);
                          setModalListTitle(list.title);
                          // Ensure currentBoard._id is defined before setting
                          setModalParentBoardId(currentBoard?._id || null);
                          setShowCardAddModal(true);
                        }}
                      />
                    </div>
                  </div>
                </React.Fragment>
              ))}
            {/* Indicator for dropping a list at the very end */}
            {draggingList && dragOverListTarget && dragOverListTarget.index === currentBoard.lists.length && currentBoard.lists.length > 0 && (
              <div className="list-drag-over-indicator"></div>
            )}

            {/* Add another list button */}
            <div
              onClick={() => addList(currentBoard._id)}
              className="flex items-center justify-center w-[280px] py-2 px-3 bg-white/50 backdrop-blur-sm rounded-md border border-gray-300 text-gray-700 hover:bg-white/70 hover:shadow transition cursor-pointer flex-shrink-0"
            >
              <PlusIcon className="mr-2" />
              <span className="text-sm">Add another list</span>
            </div>
          </div>
        </div>
      ) : subBoard ? (
        // Sub-Board View
        <div
          key={`sub-board-${boardUpdateKey}`} // Key to force re-render
          className="relative min-h-screen w-full"
        >
          <img
            src="/pexels-ds-stories-6991505.jpg"
            className="absolute inset-0 w-full h-full object-cover"
            alt="bg"
          />
          <button
            onClick={() => setSubBoard(null)}
            className="fixed top-4 left-4 bg-gray-700 text-white px-3 py-1 rounded shadow"
          >
            ← Back to Project
          </button>

          <div
            className="relative p-4 mt-16 flex overflow-x-auto space-x-4 items-start"
            onDragEnd={(e) => {
              handleDragEnd(e, true); // Card drag end
              handleListDrop(e, dragOverListTarget?.index); // List drag end
            }}
          >
            {subBoard.lists
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((list, listIndex) => (
                <React.Fragment key={list._id}>
                  {isListDragOverPosition(listIndex) && (
                    <div className="list-drag-over-indicator"></div>
                  )}
                  <div
                    draggable="true"
                    onDragStart={(e) => handleListDragStart(e, list._id, listIndex)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggingList) {
                        handleListDragOver(e, listIndex);
                      } else if (draggingCard) {
                        if (e.currentTarget === e.target) {
                          setDragOverTarget({ listId: list._id, cardIndex: list.cards.length });
                        }
                      }
                    }}
                    onDrop={(e) => {
                      if (draggingList) {
                        handleListDrop(e, listIndex);
                      } else if (draggingCard) {
                        handleDragEnd(e, true);
                      }
                    }}
                    className="bg-gray-100 p-4 rounded mb-4 w-[280px] flex-shrink-0"
                  >
                    <ListHeader
                      listTitle={list.title}
                      onDelete={() => handleDeleteList(list._id, subBoard._id)}
                      onRename={() => handleRenameList(list._id, subBoard._id)}
                    />

                    {/* Inner Droppable area for cards */}
                    <div
                      className="min-h-[50px]"
                      // Removed onDragOver from here
                      onDrop={(e) => handleDragEnd(e, true)}
                    >
                      {list.cards
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map((card, index) => (
                          <React.Fragment key={card._id}>
                            {isDragOverPosition(list._id, index) && (
                              <div className="drag-over-indicator"></div>
                            )}
                            <div
                              draggable="true"
                              onDragStart={(e) => handleCardDragStart(e, card, list._id, index)}
                              onDragOver={(e) => handleCardDragOver(e, list._id, index)}
                              onDrop={(e) => handleDragEnd(e, true)}
                              onClick={() => {
                                if (card.type === "project-card" && card.subBoardId) {
                                  fetchSubBoard(card.subBoardId);
                                }
                              }}
                            >
                              <CardItem
                                card={card}
                                onEdit={setEditCard}
                                onDelete={handleDeleteCard}
                                isDragging={draggingCard && draggingCard.id === card._id}
                              />
                            </div>
                          </React.Fragment>
                        ))}
                      {/* Placeholder for dropping at the end of a list */}
                      {draggingCard && dragOverTarget && dragOverTarget.listId === list._id &&
                       dragOverTarget.cardIndex === list.cards.length && list.cards.length > 0 && (
                        <div className="drag-over-indicator"></div>
                      )}
                      {/* Empty list drop area visual cue */}
                      {list.cards.length === 0 && draggingCard && dragOverTarget && dragOverTarget.listId === list._id && (
                        <div className="min-h-[50px] border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                          Drop cards here
                        </div>
                      )}
                      <AddCardButton
                        onClick={() => {
                          setModalListId(list._id);
                          setModalListTitle(list.title);
                          // Set the parent board ID to the subBoard's ID
                          setModalParentBoardId(subBoard?._id || null);
                          setShowCardAddModal(true);
                        }}
                      />
                    </div>
                  </div>
                </React.Fragment>
              ))}
            {/* Indicator for dropping a list at the very end */}
            {draggingList && dragOverListTarget && dragOverListTarget.index === subBoard.lists.length && subBoard.lists.length > 0 && (
              <div className="list-drag-over-indicator"></div>
            )}

            {/* Add another list button */}
            <div
              onClick={() => addList(subBoard._id)}
              className="flex items-center justify-center w-[280px] py-2 px-3 bg-white/50 backdrop-blur-sm rounded-md border border-gray-300 text-gray-700 hover:bg-white/70 hover:shadow transition cursor-pointer flex-shrink-0"
            >
              <PlusIcon className="mr-2" />
              <span className="text-sm">Add another list</span>
            </div>
          </div>
        </div>
      ) : (
        // Loading state or fallback for authenticated user without a board loaded
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600 text-lg animate-pulse">Loading...</div>
        </div>
      )}

      {/* Modals are rendered outside the conditional main content blocks */}
      {editCard && (
        <CardEditModal
          card={editCard}
          onClose={() => setEditCard(null)}
          onSave={async (updates) => {
            try {
              await axios.patch(`${API_URL}/cards/${editCard._id}`, updates, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setEditCard(null);
              // Determine which board to refetch based on whether we are in subBoard view
              if (subBoard && subBoard._id) {
                await fetchSubBoard(subBoard._id); // Ensure sub-board is refreshed first
                if (currentBoard && currentBoard._id) {
                  await fetchBoard(currentBoard._id); // Also refresh the main board for progress update
                }
              } else if (currentBoard && currentBoard._id) {
                await fetchBoard(currentBoard._id);
              }
              showMessage("Card updated successfully!", 'success');
            } catch (error) {
              console.error("Error saving card:", error);
              showMessage("Failed to save card changes.", 'error');
            }
          }}
        />
      )}

      <CardAddModal
        isOpen={showCardAddModal}
        onClose={() => setShowCardAddModal(false)}
        listTitle={modalListTitle}
        parentBoardId={modalParentBoardId} // Pass the new state variable as a prop
        onSubmit={handleCardAddSubmit} // Use the useCallback defined above
      />
      {/* MessageBox is always rendered at the root of the App component's return */}
      <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
    </div>
  );
}
