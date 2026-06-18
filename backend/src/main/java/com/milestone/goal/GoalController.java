package com.milestone.goal;

import com.milestone.dto.ApiDto.GoalDto;
import com.milestone.dto.Requests.EventRequest;
import com.milestone.dto.Requests.GoalRequest;
import com.milestone.dto.Requests.MilestoneRequest;
import com.milestone.dto.Requests.TaskRequest;
import com.milestone.security.AuthUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class GoalController {

    private final GoalService service;

    public GoalController(GoalService service) {
        this.service = service;
    }

    // ---- goals ----
    @GetMapping("/goals")
    public List<GoalDto> list(@AuthenticationPrincipal AuthUser u) {
        return service.list(u.id());
    }

    @PostMapping("/goals")
    @ResponseStatus(HttpStatus.CREATED)
    public GoalDto create(@AuthenticationPrincipal AuthUser u, @Valid @RequestBody GoalRequest req) {
        return service.create(u.id(), req);
    }

    @PutMapping("/goals/{id}")
    public GoalDto update(
            @AuthenticationPrincipal AuthUser u,
            @PathVariable Long id,
            @Valid @RequestBody GoalRequest req) {
        return service.update(u.id(), id, req);
    }

    @DeleteMapping("/goals/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser u, @PathVariable Long id) {
        service.delete(u.id(), id);
    }

    // ---- milestones ----
    @PostMapping("/goals/{goalId}/milestones")
    public GoalDto addMilestone(
            @AuthenticationPrincipal AuthUser u,
            @PathVariable Long goalId,
            @Valid @RequestBody MilestoneRequest req) {
        return service.addMilestone(u.id(), goalId, req);
    }

    @PutMapping("/milestones/{id}")
    public GoalDto updateMilestone(
            @AuthenticationPrincipal AuthUser u,
            @PathVariable Long id,
            @RequestBody MilestoneRequest req) {
        return service.updateMilestone(u.id(), id, req);
    }

    @PutMapping("/milestones/{id}/move")
    public GoalDto moveMilestone(
            @AuthenticationPrincipal AuthUser u,
            @PathVariable Long id,
            @RequestParam int dir) {
        return service.moveMilestone(u.id(), id, dir);
    }

    @DeleteMapping("/milestones/{id}")
    public GoalDto deleteMilestone(@AuthenticationPrincipal AuthUser u, @PathVariable Long id) {
        return service.deleteMilestone(u.id(), id);
    }

    // ---- tasks ----
    @PostMapping("/milestones/{milestoneId}/tasks")
    public GoalDto addTask(
            @AuthenticationPrincipal AuthUser u,
            @PathVariable Long milestoneId,
            @RequestBody TaskRequest req) {
        return service.addTask(u.id(), milestoneId, req);
    }

    @PutMapping("/tasks/{id}")
    public GoalDto updateTask(
            @AuthenticationPrincipal AuthUser u,
            @PathVariable Long id,
            @RequestBody TaskRequest req) {
        return service.updateTask(u.id(), id, req);
    }

    @DeleteMapping("/tasks/{id}")
    public GoalDto deleteTask(@AuthenticationPrincipal AuthUser u, @PathVariable Long id) {
        return service.deleteTask(u.id(), id);
    }

    // ---- events ----
    @PostMapping("/goals/{goalId}/events")
    public GoalDto addEvent(
            @AuthenticationPrincipal AuthUser u,
            @PathVariable Long goalId,
            @Valid @RequestBody EventRequest req) {
        return service.addEvent(u.id(), goalId, req);
    }
}
