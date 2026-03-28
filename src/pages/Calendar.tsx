import React, { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  startOfDay,
  addMinutes,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
// removed toast and second fr import

import {
  Plus,
  User,
  Users,
  CreditCard,
  Banknote,
  Copy,
  QrCode,
  Link as LinkIcon,
  Calendar as CalendarIcon,
  Check,
  List as ListView,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { t } from "../i18n";
import { createAppointmentPaymentLink } from "../lib/stripe";
import { ResponsiveModal } from "../components/ResponsiveModal";

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
}

interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  duration: number;
  client_id: string | null;
  type: "private" | "group";
  max_participants: number;
  current_participants: number;
  status: string;
  notes: string;
  price: number;
  payment_method?: string;
  payment_link?: string;
  payment_status?: string;
  group_visibility?: "public" | "private";
}

function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Removed duplicate loading state

  const { user } = useAuth();

  // Set default view based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode("list");
      } else {
        setViewMode("calendar");
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch appointments
      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select("*")
          .eq("coach_id", user?.id)
          .gte("start", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
          .limit(500);

      if (appointmentsError) throw appointmentsError;

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, full_name, email, phone")
        .eq("coach_id", user?.id)
        .eq("status", "active");

      if (clientsError) throw clientsError;

      setAppointments(
        (appointmentsData || []).map((apt) => ({
          ...apt,
          start: new Date(apt.start),
          end: new Date(apt.end),
        }))
      );
      setClients(clientsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: Appointment) => {
    setSelectedAppointment(event);
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const selectedDateEvents = appointments
    .filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === currentDate.toDateString();
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // --- Date Math for Custom Grid ---
  // Week starts on Monday
  const weekStart = startOfWeek(currentDate, { locale: fr, weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStart, i)
  );
  const START_HOUR = 6;
  const END_HOUR = 22;
  const HOUR_HEIGHT = 48; // px (Reduced from 64px to make it more compact)

  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  const handleDragStart = (eventId: string) => {
    setDraggedEventId(eventId);
  };

  const handleDrop = async (eventId: string, slotId: string) => {
    setDraggedEventId(null);
    if (!eventId || !slotId) return;

    // Parse the droppable area ID, e.g., "2026-03-02|09:30"
    const [dateString, timeString] = slotId.split("|");
    if (!dateString || !timeString) return;

    const oldApt = appointments.find((a) => a.id === eventId);
    if (!oldApt) return;

    const [hour, minute] = timeString.split(":").map(Number);
    const newStartDate = new Date(dateString);
    newStartDate.setHours(hour, minute, 0, 0);
    const newEndDate = addMinutes(newStartDate, oldApt.duration);

    // Optimistic update
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === eventId ? { ...a, start: newStartDate, end: newEndDate } : a
      )
    );

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ start: newStartDate.toISOString() })
        .eq("id", eventId);

      if (error) throw error;
    } catch (e) {
      console.error("Erreur lors du déplacement", e);
      // Revert on error
      fetchData();
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-[2560px] mx-auto animate-fade-in flex flex-col h-[calc(100vh-5rem)] lg:h-[calc(100vh-2rem)]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        {/* Desktop Date Navigation */}
        {viewMode === "calendar" && (
          <div className="hidden lg:flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 w-fit">
            <button
              onClick={() => {
                const prevWeek = new Date(currentDate);
                prevWeek.setDate(prevWeek.getDate() - 7);
                setCurrentDate(prevWeek);
              }}
              className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => {
                const nextWeek = new Date(currentDate);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setCurrentDate(nextWeek);
              }}
              className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="px-4 font-semibold text-white capitalize hidden xl:block">
              {format(weekStart, "MMMM yyyy", { locale: fr })}
            </span>
          </div>
        )}

        {/* Mobile View Toggle & New Session Button */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end ml-auto">
          <div className="flex bg-white/5 p-1 rounded-xl lg:hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ListView className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "calendar"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedAppointment(null);
              setIsModalOpen(true);
            }}
            className="primary-button flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t("calendar.newSession")}</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>
      </div>

      {/* List View Navigation (Mobile Only) */}
      {viewMode === "list" && (
        <div className="flex items-center justify-between mb-6 bg-white/5 p-4 rounded-2xl border border-white/5 lg:hidden glass">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white capitalize">
              {format(currentDate, "EEEE d MMMM", { locale: fr })}
            </h3>
            <p className="text-sm text-gray-400">
              {selectedDateEvents.length} événement
              {selectedDateEvents.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Custom Pro-Max Calendar View */}
      <div
        className={`glass p-0 flex-1 overflow-hidden flex flex-col rounded-2xl shadow-xl border border-white/5 bg-[#0a0a0a] ${
          viewMode === "list" ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* Calendar Header (Days) */}
        <div className="flex border-b border-white/5 bg-black/40 backdrop-blur-md z-20">
          <div className="w-16 flex-shrink-0" /> {/* Time gutter spacer */}
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-3 text-center border-l border-white/5 flex flex-col items-center justify-center gap-1 ${
                  isToday(day) ? "bg-blue-500/5" : ""
                }`}
              >
                <span
                  className={`text-xs uppercase tracking-wider font-semibold ${
                    isToday(day) ? "text-blue-500" : "text-gray-500"
                  }`}
                >
                  {format(day, "EEE", { locale: fr })}
                </span>
                <span
                  className={`text-xl font-bold flex items-center justify-center w-8 h-8 rounded-full ${
                    isToday(day)
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-300"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div
            className="flex relative"
            style={{
              minHeight: `${(END_HOUR - START_HOUR + 1) * HOUR_HEIGHT}px`,
            }}
          >
            {/* Time Gutter */}
            <div className="w-16 flex-shrink-0 border-r border-white/5 bg-black/20 flex flex-col relative z-10">
              {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="relative flex justify-center w-full"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="absolute -top-3 text-xs font-medium text-gray-500 bg-[#0a0a0a] px-1">
                    {START_HOUR + i}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Grid Columns */}
            <div className="flex-1 grid grid-cols-7 relative">
              {/* Horizontal Grid Lines */}
              <div className="absolute inset-0 z-0 pointer-events-none flex flex-col">
                {Array.from({ length: END_HOUR - START_HOUR + 1 }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="border-b border-white/[0.03] w-full"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    />
                  )
                )}
              </div>

              {/* Day Columns */}
              {weekDays.map((day) => {
                const dayEvents = appointments.filter((a) =>
                  isSameDay(new Date(a.start), day)
                );
                const now = new Date();
                const showCurrentTime =
                  isSameDay(day, now) &&
                  now.getHours() >= START_HOUR &&
                  now.getHours() <= END_HOUR;

                return (
                  <div
                    key={day.toISOString()}
                    className={`relative border-l border-white/5 ${
                      isToday(day) ? "bg-blue-500/[0.02]" : ""
                    }`}
                  >
                    {/* Droppable areas (30 min increments) */}
                    {Array.from({
                      length: (END_HOUR - START_HOUR + 1) * 2,
                    }).map((_, i) => {
                      const timeValue = addMinutes(
                        startOfDay(day),
                        START_HOUR * 60 + i * 30
                      );
                      return (
                        <DroppableSlot
                          key={i}
                          id={`${format(day, "yyyy-MM-dd")}|${format(
                            timeValue,
                            "HH:mm"
                          )}`}
                          hourHeight={HOUR_HEIGHT}
                          startHour={START_HOUR}
                          onClick={() => {
                            setSelectedSlot({
                              start: timeValue,
                              end: addMinutes(timeValue, 60),
                            });
                            setIsModalOpen(true);
                          }}
                          onDrop={handleDrop}
                        />
                      );
                    })}

                    {/* Current Time Indicator */}
                    {showCurrentTime && (
                      <div
                        className="absolute w-full z-20 pointer-events-none flex items-center shadow-lg"
                        style={{
                          top: `${
                            ((now.getHours() - START_HOUR) * 60 +
                              now.getMinutes()) *
                            (HOUR_HEIGHT / 60)
                          }px`,
                          left: 0,
                        }}
                      >
                        <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 flex-1 opacity-80" />
                      </div>
                    )}

                    {/* Events for this day */}
                    {dayEvents.map((event) => (
                      <DraggableEvent
                        key={event.id}
                        event={event}
                        clients={clients}
                        startHour={START_HOUR}
                        hourHeight={HOUR_HEIGHT}
                        onClick={() => handleSelectEvent(event)}
                        onDragStart={handleDragStart}
                        onDragEnd={() => setDraggedEventId(null)}
                        isDragging={draggedEventId === event.id}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SmartAgenda View (Mobile Only) */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-y-auto space-y-4 pb-24 lg:hidden custom-scrollbar px-1">
          {selectedDateEvents.length > 0 ? (
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-[39px] top-4 bottom-4 w-px bg-gradient-to-b from-blue-500/50 via-indigo-500/20 to-transparent" />

              <div className="space-y-6">
                {selectedDateEvents.map((event) => {
                  const isPrivate = event.type === "private";
                  const clientName = isPrivate
                    ? clients.find((c) => c.id === event.client_id)
                        ?.full_name || "Client inconnu"
                    : `${event.current_participants || 0}/${
                        event.max_participants || 0
                      } participants`;

                  return (
                    <div
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className="relative flex gap-4 cursor-pointer group active:scale-[0.98] transition-transform"
                    >
                      {/* Timeline Node */}
                      <div className="flex flex-col items-center mt-1 z-10 w-20 flex-shrink-0">
                        <span className="text-sm font-bold text-white mb-1">
                          {format(new Date(event.start), "HH:mm")}
                        </span>
                        <div
                          className={`w-3 h-3 rounded-full border-2 border-[#0a0a0a] ring-2 ${
                            isPrivate
                              ? "ring-blue-500 bg-blue-400"
                              : "ring-emerald-500 bg-emerald-400"
                          } shadow-[0_0_10px_rgba(59,130,246,0.5)]`}
                        />
                        <span className="text-[10px] text-gray-400 mt-1 font-medium">
                          {event.duration} min
                        </span>
                      </div>

                      {/* Event Card */}
                      <div
                        className={`flex-1 glass p-4 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden bg-gradient-to-br ${
                          isPrivate
                            ? "from-blue-900/10 to-transparent"
                            : "from-emerald-900/10 to-transparent"
                        }`}
                      >
                        {/* Status subtle glow */}
                        <div
                          className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 -mr-16 -mt-16 pointer-events-none ${
                            isPrivate ? "bg-blue-500" : "bg-emerald-500"
                          }`}
                        />

                        <div className="relative z-10">
                          <h4 className="font-bold text-white text-base leading-tight mb-2 pr-6">
                            {event.title || "Séance"}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-300">
                            <div className="flex items-center gap-1.5">
                              {isPrivate ? (
                                <User className="w-4 h-4 text-blue-400" />
                              ) : (
                                <Users className="w-4 h-4 text-emerald-400" />
                              )}
                              <span className="font-medium text-white/90 truncate max-w-[140px]">
                                {clientName}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {event.payment_method === "online" ? (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  <CreditCard className="w-3 h-3" />
                                  <span>En ligne</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Banknote className="w-3 h-3" />
                                  <span>Sur place</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    event.payment_status === "paid"
                                      ? "bg-green-500"
                                      : "bg-amber-500"
                                  }`}
                                />
                                <span className="text-xs text-gray-400">
                                  {event.payment_status === "paid"
                                    ? "Payé"
                                    : "En attente"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 glass rounded-2xl border border-dashed border-white/10 mt-8">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 relative">
                <CalendarIcon className="w-8 h-8 text-gray-500" />
                <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#0a0a0a]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Journée libre
              </h3>
              <p className="text-gray-400 text-sm">
                Aucune séance programmée pour le <br />
                <span className="text-blue-400 font-medium">
                  {format(currentDate, "d MMMM", { locale: fr })}
                </span>
              </p>
              <button
                onClick={() => {
                  setSelectedSlot({
                    start: new Date(currentDate.setHours(9, 0, 0, 0)),
                    end: new Date(currentDate.setHours(10, 0, 0, 0)),
                  });
                  setSelectedAppointment(null);
                  setIsModalOpen(true);
                }}
                className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter une séance
              </button>
            </div>
          )}
        </div>
      )}

      {/* Appointment Modal */}
      {isModalOpen && (
        <AppointmentModal
          appointment={selectedAppointment}
          selectedSlot={selectedSlot}
          clients={clients}
          onClose={() => setIsModalOpen(false)}
          onSave={async (appointmentData: any) => {
            // ... saving logic
            try {
              const formattedData = {
                title: appointmentData.title,
                start: appointmentData.start.toISOString(),
                duration: appointmentData.duration,
                client_id:
                  appointmentData.type === "private"
                    ? appointmentData.client_id
                    : null,
                type: appointmentData.type,
                group_visibility:
                  appointmentData.type === "group"
                    ? appointmentData.group_visibility
                    : null,
                max_participants:
                  appointmentData.type === "group" &&
                  appointmentData.group_visibility === "public"
                    ? appointmentData.max_participants
                    : null,
                current_participants: appointmentData.current_participants,
                status: appointmentData.status,
                notes: appointmentData.notes,
                price: appointmentData.price,
                payment_method: appointmentData.payment_method,
                payment_status: "pending",
                coach_id: user?.id,
                session_id: appointmentData.session_id, // Save the link
              };

              if (selectedAppointment) {
                const { error } = await supabase
                  .from("appointments")
                  .update(formattedData)
                  .eq("id", selectedAppointment.id);

                if (error) throw error;

                if (
                  appointmentData.type === "group" &&
                  appointmentData.group_visibility === "private"
                ) {
                  await supabase
                    .from("appointment_participants")
                    .delete()
                    .eq("appointment_id", selectedAppointment.id);

                  if (appointmentData.selectedClients?.length > 0) {
                    // ...
                  }
                }
              } else {
                const { error } = await supabase
                  .from("appointments")
                  .insert([formattedData])
                  .select()
                  .single();

                if (error) throw error;
                // ...
              }

              fetchData();
              setIsModalOpen(false);
            } catch (error) {
              console.error("Error saving appointment:", error);
            }
          }}
          user={user}
        />
      )}
    </div>
  );
}

// === Custom Drag & Drop Components ===

function DroppableSlot({
  id,
  hourHeight,
  startHour,
  onClick,
  onDrop,
}: {
  id: string;
  hourHeight: number;
  startHour: number;
  onClick: () => void;
  onDrop: (eventId: string, slotId: string) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onClick={onClick}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const eventId = e.dataTransfer.getData("text/plain");
        if (eventId) {
          onDrop(eventId, id);
        }
      }}
      className={`absolute w-full cursor-pointer transition-colors z-0 hover:bg-white/5 ${
        isOver ? "bg-white/10 ring-1 ring-white/20" : ""
      }`}
      style={{
        height: `${hourHeight / 2}px`,
        top: `${
          (parseInt(id.split("|")[1]?.split(":")[1] || "0") === 30
            ? hourHeight / 2
            : 0) +
          (parseInt(id.split("|")[1]?.split(":")[0] || "0") - startHour) *
            hourHeight
        }px`,
      }}
    />
  );
}

function DraggableEvent({
  event,
  clients,
  startHour,
  hourHeight,
  onClick,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  event: Appointment;
  clients: Client[];
  startHour: number;
  hourHeight: number;
  onClick?: () => void;
  isDragging?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}) {
  const startDate = new Date(event.start);
  const topPixels =
    ((startDate.getHours() - startHour) * 60 + startDate.getMinutes()) *
    (hourHeight / 60);
  const heightPixels = event.duration * (hourHeight / 60);

  const isPrivate = event.type === "private";
  const clientName = isPrivate
    ? clients.find((c: any) => c.id === event.client_id)?.full_name || "Client"
    : `${event.current_participants}/${event.max_participants} part.`;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", event.id);
        e.dataTransfer.effectAllowed = "move";
        // Need to set timeout so browser renders ghost from opaque element before we set it semi-transparent
        if (onDragStart) {
          setTimeout(() => onDragStart(event.id), 0);
        }
      }}
      onDragEnd={() => {
        if (onDragEnd) onDragEnd();
      }}
      onClick={onClick}
      style={{
        top: `${topPixels}px`,
        height: `${heightPixels}px`,
      }}
      className={`absolute left-1 right-1 p-[1px] rounded-xl transition-all duration-200 cursor-pointer 
        ${
          isDragging
            ? "opacity-40 scale-[0.98] z-30 shadow-none"
            : "opacity-100 hover:scale-[1.02] hover:z-30 shadow-lg shadow-black/20"
        }
      `}
    >
      <div
        className={`w-full h-full rounded-[11px] p-2 flex flex-col gap-1 overflow-hidden backdrop-blur-md border bg-gradient-to-br transition-colors
        ${
          isDragging
            ? isPrivate
              ? "border-blue-400/50 from-blue-500/90 to-indigo-500/90"
              : "border-emerald-400/50 from-emerald-500/90 to-teal-500/90"
            : isPrivate
            ? "border-white/20 from-blue-600/80 to-indigo-600/80"
            : "border-white/20 from-emerald-600/80 to-teal-600/80"
        }`}
      >
        <div className="flex items-center gap-1.5 opacity-90">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span className="text-[10px] font-semibold leading-none tracking-wider uppercase">
            {format(startDate, "HH:mm")} -{" "}
            {format(new Date(event.end), "HH:mm")}
          </span>
        </div>

        <h4 className="font-bold text-sm leading-tight text-white mb-auto drop-shadow-sm">
          {event.title || "Séance"}
        </h4>

        {event.duration >= 30 && (
          <div className="flex items-center gap-2 text-xs font-medium text-white/90">
            {isPrivate ? (
              <User className="w-3.5 h-3.5" />
            ) : (
              <Users className="w-3.5 h-3.5" />
            )}
            <span className="truncate">{clientName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ... existing imports and code

function AppointmentModal({
  appointment,
  selectedSlot,
  clients,
  onClose,
  onSave,
  user,
}: any) {
  // ... existing state and logic ...
  const getValidDate = (dateValue: any) => {
    if (!dateValue) {
      return selectedSlot?.start || new Date();
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? selectedSlot?.start || new Date() : date;
  };

  const [formData, setFormData] = useState({
    title: appointment?.title || "",
    start: getValidDate(appointment?.start),
    duration: appointment?.duration || 60,
    client_id: appointment?.client_id || "",
    type: appointment?.type || "private",
    group_visibility: appointment?.group_visibility || "public",
    max_participants: appointment?.max_participants || 5,
    current_participants: appointment?.current_participants || 1,
    status: appointment?.status || "scheduled",
    notes: appointment?.notes || "",
    price: appointment?.price || 0,
    payment_method: appointment?.payment_method || "in_person",
    session_id: appointment?.session_id || null, // Linked session
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [sessions, setSessions] = useState<any[]>([]); // Available sessions
  const [registeredParticipants, setRegisteredParticipants] = useState<any[]>(
    []
  );
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [paymentLink, setPaymentLink] = useState(
    appointment?.payment_link || ""
  );
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSessions(); // Fetch available templates
    if (appointment?.id && appointment?.type === "group") {
      fetchRegisteredParticipants();
    }
    if (appointment?.payment_link) {
      setPaymentLink(appointment.payment_link);
    }
  }, [appointment?.id, appointment?.payment_link]);

  const fetchSessions = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("sessions")
        .select("id, name, duration_minutes")
        .eq("coach_id", user.id)
        .eq("is_template", true)
        .is("archived_at", null)
        .order("name");

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchRegisteredParticipants = async () => {
    try {
      setLoadingParticipants(true);
      const { data, error } = await supabase
        .from("appointment_registrations")
        .select(
          `
      id,
      status,
      registered_at,
      client:clients (
      id,
      full_name,
      email,
      phone
      )
      `
        )
        .eq("appointment_id", appointment.id)
        .in("status", ["registered", "confirmed"]);

      if (error) throw error;
      setRegisteredParticipants(data || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, selectedClients });
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleGeneratePaymentLink = async () => {
    if (!appointment?.id) return;

    try {
      setGeneratingLink(true);
      const result = await createAppointmentPaymentLink(appointment.id);
      setPaymentLink(result.url);
    } catch (error: any) {
      console.error("Error generating payment link:", error);
      const errorMessage =
        error?.message || "Erreur lors de la génération du lien de paiement";
      alert(errorMessage);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const footer = (
    <div className="flex justify-end gap-4 w-full">
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors touch-target"
      >
        Annuler
      </button>
      <button
        type="submit"
        form="appointment-form"
        className="primary-button touch-target"
      >
        {appointment ? "Mettre à jour" : "Créer"}
      </button>
    </div>
  );

  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      position="right"
      title={appointment ? "Modifier la séance" : "Nouvelle séance"}
      footer={footer}
    >
      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Titre
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Ex: Séance Jambes, Yoga..."
          />
        </div>

        {/* Session Linking */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contenu de la séance (optionnel)
          </label>
          <select
            name="session_id"
            value={formData.session_id || ""}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">-- Sélectionner une séance type --</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_minutes} min)
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Permet aux clients de lancer la séance et d'enregistrer leurs
            performances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Début
            </label>
            <input
              type="datetime-local"
              name="start"
              value={
                formData.start
                  ? format(new Date(formData.start), "yyyy-MM-dd'T'HH:mm")
                  : ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  start: new Date(e.target.value),
                }))
              }
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Durée
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              className="input-field appearance-none cursor-pointer"
            >
              <option value="30" className="bg-gray-800">
                30 minutes
              </option>
              <option value="45" className="bg-gray-800">
                45 minutes
              </option>
              <option value="60" className="bg-gray-800">
                1 heure
              </option>
              <option value="90" className="bg-gray-800">
                1 heure 30
              </option>
              <option value="120" className="bg-gray-800">
                2 heures
              </option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type de séance
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-black/20 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, type: "private" }));
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.type === "private"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <User className="w-4 h-4" />
                Privée
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    type: "group",
                    client_id: "",
                  }));
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  formData.type === "group"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Users className="w-4 h-4" />
                Groupe
              </button>
            </div>
          </div>

          {formData.type === "private" ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required={formData.type === "private"}
                className="input-field appearance-none cursor-pointer"
              >
                <option value="" className="bg-gray-800">
                  Sélectionner un client
                </option>
                {clients.map((client: Client) => (
                  <option
                    key={client.id}
                    value={client.id}
                    className="bg-gray-800"
                  >
                    {client.full_name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visibilité
              </label>
              <select
                name="group_visibility"
                value={formData.group_visibility}
                onChange={(e) => {
                  handleChange(e);
                  if (e.target.value === "public") {
                    setSelectedClients([]);
                  }
                }}
                className="input-field appearance-none cursor-pointer"
              >
                <option value="public" className="bg-gray-800">
                  Public (ouvert à tous)
                </option>
                <option value="private" className="bg-gray-800">
                  Privé (sur invitation)
                </option>
              </select>
            </div>
          )}
        </div>

        {formData.type === "group" &&
          formData.group_visibility === "public" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Participants max
              </label>
              <input
                type="number"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleChange}
                min="2"
                required
                className="input-field"
              />
            </div>
          )}

        {formData.type === "group" &&
          formData.group_visibility === "private" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Clients invités
              </label>
              <div className="border border-white/10 rounded-xl p-3 max-h-48 overflow-y-auto bg-black/20 custom-scrollbar">
                {clients.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Aucun client disponible
                  </p>
                ) : (
                  <div className="space-y-1">
                    {clients.map((client: Client) => (
                      <label
                        key={client.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedClients.includes(client.id)
                            ? "bg-primary-500/10 border border-primary-500/30"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            selectedClients.includes(client.id)
                              ? "bg-primary-500 border-primary-500"
                              : "border-gray-500"
                          }`}
                        >
                          {selectedClients.includes(client.id) && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client.id)}
                          onChange={() => toggleClientSelection(client.id)}
                          className="hidden"
                        />
                        <span
                          className={`text-sm ${
                            selectedClients.includes(client.id)
                              ? "text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {client.full_name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {selectedClients.length} client
                {selectedClients.length > 1 ? "s" : ""} sélectionné
                {selectedClients.length > 1 ? "s" : ""}
              </p>
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prix (CHF)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Statut
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field appearance-none cursor-pointer"
            >
              <option value="scheduled" className="bg-gray-800">
                Planifié
              </option>
              <option value="completed" className="bg-gray-800">
                Terminé
              </option>
              <option value="cancelled" className="bg-gray-800">
                Annulé
              </option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Mode de paiement
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, payment_method: "online" }))
              }
              className={`p-4 rounded-xl border transition-all ${
                formData.payment_method === "online"
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/50"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-400"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <CreditCard
                  className={`w-6 h-6 ${
                    formData.payment_method === "online"
                      ? "text-cyan-400"
                      : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    formData.payment_method === "online"
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  En ligne
                </span>
                <span className="text-xs text-gray-500 text-center">
                  Stripe / Carte
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  payment_method: "in_person",
                }))
              }
              className={`p-4 rounded-xl border transition-all ${
                formData.payment_method === "in_person"
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/50"
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-gray-400"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Banknote
                  className={`w-6 h-6 ${
                    formData.payment_method === "in_person"
                      ? "text-cyan-400"
                      : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    formData.payment_method === "in_person"
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  Sur place
                </span>
                <span className="text-xs text-gray-500 text-center">
                  Cash / TWINT
                </span>
              </div>
            </button>
          </div>
        </div>

        {appointment?.id && formData.type === "group" && (
          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants inscrits
              </h3>
              <span className="text-sm text-gray-400">
                {registeredParticipants.length} / {formData.max_participants}
              </span>
            </div>

            {loadingParticipants ? (
              <div className="text-center py-4 text-gray-500">
                Chargement des participants...
              </div>
            ) : registeredParticipants.length > 0 ? (
              <div className="space-y-2">
                {registeredParticipants.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {reg.client?.full_name?.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">
                          {reg.client?.full_name}
                        </p>
                        <div className="flex gap-3 text-xs text-gray-500">
                          {/* {reg.client?.email && <span>{reg.client.email}</span>} */}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      Inscrit
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                Aucun participant inscrit pour le moment
              </div>
            )}
          </div>
        )}

        {appointment?.id && formData.payment_method === "online" && (
          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Lien de paiement
              </h3>
            </div>

            {paymentLink ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <LinkIcon className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">
                      Lien actif
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={paymentLink}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-black/20 border border-white/10 rounded-lg text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors border border-white/10 touch-target"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copié!" : "Copier"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQR(!showQR)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors border border-white/10 touch-target"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {showQR && (
                  <div className="flex justify-center p-6 bg-white rounded-xl border border-white/10">
                    <div className="text-center">
                      <QRCodeSVG value={paymentLink} size={180} level="H" />
                      <p className="mt-3 text-sm text-gray-800 font-medium">
                        Scannez pour payer
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGeneratePaymentLink}
                disabled={generatingLink}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 disabled:opacity-50 text-white rounded-xl transition-colors flex items-center justify-center gap-2 touch-target"
              >
                {generatingLink ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5" />
                    Générer le lien de paiement
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Notes pour la séance..."
            className="input-field"
          />
        </div>
      </form>
    </ResponsiveModal>
  );
}

export default CalendarPage;
