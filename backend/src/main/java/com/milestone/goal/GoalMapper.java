package com.milestone.goal;

import com.milestone.dto.ApiDto.EventDto;
import com.milestone.dto.ApiDto.GoalDto;
import com.milestone.dto.ApiDto.MilestoneDto;
import com.milestone.dto.ApiDto.TaskDto;
import java.util.Comparator;
import java.util.List;

/** Maps JPA entities to response DTOs in the shape the frontend expects. */
final class GoalMapper {
    private GoalMapper() {}

    static GoalDto toDto(Goal g) {
        List<MilestoneDto> ms =
                g.getMilestones().stream()
                        .sorted(Comparator.comparingInt(Milestone::getPosition))
                        .map(GoalMapper::toDto)
                        .toList();
        List<EventDto> events =
                g.getEvents().stream()
                        .sorted(Comparator.comparing(GoalEvent::getTs).reversed())
                        .map(e -> new EventDto(e.getId(), e.getTs().toString(), e.getText()))
                        .toList();
        return new GoalDto(
                g.getId(),
                g.getTitle(),
                g.getWhy(),
                g.getTargetDate() == null ? null : g.getTargetDate().toString(),
                g.getCreatedAt().toString(),
                g.getDifficulty(),
                ms,
                events);
    }

    static MilestoneDto toDto(Milestone m) {
        List<TaskDto> tasks =
                m.getTasks().stream()
                        .sorted(Comparator.comparingInt(Task::getPosition))
                        .map(t -> new TaskDto(t.getId(), t.getTitle(), t.isDone()))
                        .toList();
        return new MilestoneDto(m.getId(), m.getTitle(), m.getWeight(), m.getStatus(), tasks);
    }
}
