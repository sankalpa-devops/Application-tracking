import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import axios from "axios";
import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const PipelineBoard = () => {

  const [data, setData] = useState({});

  const fetchPipeline = async () => {
    const res = await axios.get(`${API}/pipeline`);
    setData(res.data);
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const candidate_id = result.draggableId;
    const newStatus = result.destination.droppableId;

    try {
      await axios.put(`${API}/update-status`, {
        candidate_id,
        status: newStatus
      });

      fetchPipeline();
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  return (
    <div className="container">
      <h3>Candidate Pipeline</h3>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "flex", gap: "20px", overflowX: "auto" }}>

          {Object.keys(data).map((stage) => (
            <Droppable droppableId={stage} key={stage}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    minWidth: "250px",
                    background: "#f4f6f8",
                    padding: "10px",
                    borderRadius: "8px"
                  }}
                >
                  <h5 style={{ textAlign: "center" }}>{stage}</h5>

                  {data[stage]?.map((c, index) => (
                    <Draggable
                      key={c.id}
                      draggableId={c.id}
                      index={index}
                    >
                      {(prov) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          style={{
                            padding: "10px",
                            marginBottom: "8px",
                            background: "#fff",
                            borderRadius: "6px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            ...prov.draggableProps.style
                          }}
                        >
                          {c.name}
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}

        </div>
      </DragDropContext>
    </div>
  );
};

export default PipelineBoard;
