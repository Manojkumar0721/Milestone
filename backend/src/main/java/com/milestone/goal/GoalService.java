package com.milestone.goal;

import com.milestone.dto.ApiDto.GoalDto;
import com.milestone.dto.Requests.EventRequest;
import com.milestone.dto.Requests.GoalRequest;
import com.milestone.dto.Requests.MilestoneRequest;
import com.milestone.dto.Requests.TaskRequest;
import com.milestone.user.User;
import com.milestone.user.UserRepository;
import com.milestone.web.ApiException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional
public class GoalService {

    private final GoalRepository goals;
    private final MilestoneRepository milestones;
    private final TaskRepository tasks;
    private final UserRepository users;

    @PersistenceContext private EntityManager em;

    public GoalService(
            GoalRepository goals,
            MilestoneRepository milestones,
            TaskRepository tasks,
            UserRepository users) {
        this.goals = goals;
        this.milestones = milestones;
        this.tasks = tasks;
        this.users = users;
    }

    // ---- goals ----
    @Transactional(readOnly = true)
    public List<GoalDto> list(Long userId) {
        return goals.findByUserIdOrderByCreatedAtAsc(userId).stream().map(GoalMapper::toDto).toList();
    }

    public GoalDto create(Long userId, GoalRequest req) {
        User user = users.getReferenceById(userId);
        Goal g = new Goal();
        g.setUser(user);
        g.setTitle(req.title().trim());
        g.setWhy(req.why());
        g.setTargetDate(parseDate(req.targetDate()));
        g.setDifficulty(StringUtils.hasText(req.difficulty()) ? req.difficulty() : "medium");
        g.addEvent("Goal created 🎯");
        return GoalMapper.toDto(goals.save(g));
    }

    public GoalDto update(Long userId, Long goalId, GoalRequest req) {
        Goal g = goalOf(userId, goalId);
        g.setTitle(req.title().trim());
        g.setWhy(req.why());
        g.setTargetDate(parseDate(req.targetDate()));
        if (StringUtils.hasText(req.difficulty())) g.setDifficulty(req.difficulty());
        return mapFresh(g);
    }

    public void delete(Long userId, Long goalId) {
        goals.delete(goalOf(userId, goalId));
    }

    // ---- milestones ----
    public GoalDto addMilestone(Long userId, Long goalId, MilestoneRequest req) {
        Goal g = goalOf(userId, goalId);
        Milestone m = new Milestone();
        m.setGoal(g);
        m.setTitle(req.title().trim());
        m.setWeight(req.weight() == null ? 3 : req.weight());
        m.setStatus(StringUtils.hasText(req.status()) ? req.status() : "todo");
        m.setPosition(nextPosition(g.getMilestones().stream().mapToInt(Milestone::getPosition)));
        g.getMilestones().add(m);
        g.addEvent("Added milestone: " + m.getTitle());
        return mapFresh(g);
    }

    public GoalDto updateMilestone(Long userId, Long milestoneId, MilestoneRequest req) {
        Milestone m = milestoneOf(userId, milestoneId);
        String before = effectiveStatus(m);
        if (StringUtils.hasText(req.title())) m.setTitle(req.title().trim());
        if (req.weight() != null) m.setWeight(req.weight());
        if (StringUtils.hasText(req.status())) m.setStatus(req.status());
        maybeLogCompletion(m, before);
        return mapFresh(m.getGoal());
    }

    public GoalDto deleteMilestone(Long userId, Long milestoneId) {
        Milestone m = milestoneOf(userId, milestoneId);
        Goal g = m.getGoal();
        g.getMilestones().remove(m);
        return mapFresh(g);
    }

    public GoalDto moveMilestone(Long userId, Long milestoneId, int dir) {
        Milestone m = milestoneOf(userId, milestoneId);
        Goal g = m.getGoal();
        List<Milestone> ordered =
                g.getMilestones().stream()
                        .sorted((a, b) -> Integer.compare(a.getPosition(), b.getPosition()))
                        .toList();
        int idx = ordered.indexOf(m);
        int swap = idx + dir;
        if (swap >= 0 && swap < ordered.size()) {
            Milestone other = ordered.get(swap);
            int tmp = m.getPosition();
            m.setPosition(other.getPosition());
            other.setPosition(tmp);
        }
        return mapFresh(g);
    }

    // ---- tasks ----
    public GoalDto addTask(Long userId, Long milestoneId, TaskRequest req) {
        Milestone m = milestoneOf(userId, milestoneId);
        if (!StringUtils.hasText(req.title())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Task title is required.");
        }
        Task t = new Task();
        t.setMilestone(m);
        t.setTitle(req.title().trim());
        t.setDone(Boolean.TRUE.equals(req.done()));
        t.setPosition(nextPosition(m.getTasks().stream().mapToInt(Task::getPosition)));
        m.getTasks().add(t);
        return mapFresh(m.getGoal());
    }

    public GoalDto updateTask(Long userId, Long taskId, TaskRequest req) {
        Task t = taskOf(userId, taskId);
        Milestone m = t.getMilestone();
        String before = effectiveStatus(m);
        if (StringUtils.hasText(req.title())) t.setTitle(req.title().trim());
        if (req.done() != null) {
            t.setDone(req.done());
            if (req.done()) m.getGoal().addEvent("Completed task: " + t.getTitle());
        }
        maybeLogCompletion(m, before);
        return mapFresh(m.getGoal());
    }

    public GoalDto deleteTask(Long userId, Long taskId) {
        Task t = taskOf(userId, taskId);
        Milestone m = t.getMilestone();
        m.getTasks().remove(t);
        return mapFresh(m.getGoal());
    }

    // ---- events ----
    public GoalDto addEvent(Long userId, Long goalId, EventRequest req) {
        Goal g = goalOf(userId, goalId);
        g.addEvent(req.text().trim());
        return mapFresh(g);
    }

    // ---- helpers ----
    private Goal goalOf(Long userId, Long goalId) {
        return goals.findByIdAndUserId(goalId, userId).orElseThrow(this::notFound);
    }

    private Milestone milestoneOf(Long userId, Long milestoneId) {
        Milestone m = milestones.findById(milestoneId).orElseThrow(this::notFound);
        if (!m.getGoal().getUser().getId().equals(userId)) throw notFound();
        return m;
    }

    private Task taskOf(Long userId, Long taskId) {
        Task t = tasks.findById(taskId).orElseThrow(this::notFound);
        if (!t.getMilestone().getGoal().getUser().getId().equals(userId)) throw notFound();
        return t;
    }

    private ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "Not found.");
    }

    /** Flush so cascade-persisted children get their generated ids before mapping. */
    private GoalDto mapFresh(Goal g) {
        em.flush();
        return GoalMapper.toDto(g);
    }

    private void maybeLogCompletion(Milestone m, String beforeStatus) {
        if (!"done".equals(beforeStatus) && "done".equals(effectiveStatus(m))) {
            m.getGoal().addEvent("Milestone complete: " + m.getTitle() + " 🏁");
        }
    }

    /** Mirrors the frontend: task-driven status when tasks exist, else the manual flag. */
    private static String effectiveStatus(Milestone m) {
        if (!m.getTasks().isEmpty()) {
            long done = m.getTasks().stream().filter(Task::isDone).count();
            if (done == 0) return "todo";
            if (done == m.getTasks().size()) return "done";
            return "active";
        }
        return m.getStatus();
    }

    private static int nextPosition(java.util.stream.IntStream positions) {
        return positions.max().orElse(-1) + 1;
    }

    private static LocalDate parseDate(String s) {
        if (!StringUtils.hasText(s)) return null;
        try {
            return LocalDate.parse(s);
        } catch (Exception e) {
            return null;
        }
    }
}
