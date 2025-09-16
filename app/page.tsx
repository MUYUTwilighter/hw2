"use client";

import {generate, list, remove} from "@/lib/powerball";
import {
  Box,
  Button,
  Card,
  CardContent, Divider,
  FormControl, IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import DeleteIcon from "@mui/icons-material/Delete";
import * as React from "react";
import type {LotteryRecord} from "@/lib/types";
import {useEffect} from "react";

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function Ball({number, isPowerBall = false}: { number: number; isPowerBall?: boolean }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        backgroundColor: isPowerBall ? "red" : "white",
        color: isPowerBall ? "white" : "gray",
        fontWeight: "bold",
        fontSize: 16,
        border: "2px solid lightgray"
      }}
    >
      {number}
    </Box>
  );
}

export default function Home() {
  const [records, setRecords] = React.useState<LotteryRecord[]>([]);
  const [selected, setSelected] = React.useState<LotteryRecord | null>(
    null
  );
  const [generated, setGenerated] = React.useState<LotteryRecord | null>(null);

  useEffect(() => {
    list().then(setRecords);
  }, []);

  return (
    <Box sx={{p: 3, maxWidth: 720, mx: "auto"}}>
      <Typography variant="h4" gutterBottom>
        Powerball
      </Typography>

      <Card sx={{mb: 3}}>
        <CardContent>
          <Stack direction="column" spacing={2} alignItems="center" justifyContent={"center"}>
            <form action={() => generate().then(record => {
              setGenerated(record);
              list().then(setRecords);
            })}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<CasinoIcon/>}
              >
                Roll
              </Button>
            </form>
            <Stack>
              {generated ? (
                <Stack direction="row" spacing={1} alignItems="center" justifyContent={"center"}>
                  {generated.lottery_numbers.map((num) => (
                    <Ball key={num} number={num}/>
                  ))}
                  <Typography variant="h6" sx={{mx: 1}}>
                    +
                  </Typography>
                  <Ball number={generated.power_ball} isPowerBall/>
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  Click Roll to generate a set of Powerball numbers.
                </Typography>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="record-select-label">History</InputLabel>
              <Select
                labelId="record-select-label"
                label="History"
                value={selected ? selected.date_generated : ""}
                onChange={(e) =>
                  setSelected(records.find(r => r.date_generated === e.target.value) || null)
                }
                renderValue={(value) => {
                  const r = records.find(r => r.date_generated === value);
                  if (!r) return "Select a record";
                  return `${formatDate(r.date_generated)}  [${r.lottery_numbers.join(
                    ", "
                  )}] PB ${r.power_ball}`;
                }}
                variant={"outlined"}>
                {records.length === 0 && (
                  <MenuItem value="">
                    <Typography color="text.secondary">
                      No records found.
                    </Typography>
                  </MenuItem>
                )}
                {records.map((r) => (
                  <MenuItem
                    key={r.date_generated}
                    value={r.date_generated}
                    sx={{display: "flex", justifyContent: "space-between", gap: 1}}
                  >
                    <Box sx={{mr: 1, overflow: "hidden"}}>
                      <Typography variant="body2" noWrap>
                        {formatDate(r.date_generated)} —{" "}
                        {r.lottery_numbers.join(", ")} | PB {r.power_ball}
                      </Typography>
                    </Box>

                    <form
                      action={() => {
                        remove(r.date_generated).then(() => {
                          list().then(setRecords);
                          if (selected?.date_generated === r.date_generated) {
                            setSelected(null);
                          }
                          if (generated?.date_generated === r.date_generated) {
                            setGenerated(null);
                          }
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="hidden"
                        name="date"
                        value={r.date_generated}
                      />
                      <IconButton
                        type="submit"
                        aria-label="Remove"
                        size="small"
                        color="error"
                      >
                        <DeleteIcon fontSize="small"/>
                      </IconButton>
                    </form>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider/>

            <Box>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              {
                selected ? (
                  <Stack spacing={1}>
                    <Typography>
                      Generated time: {formatDate(selected.date_generated)}
                    </Typography>
                    <Typography>
                      Lottery Numbers: {selected.lottery_numbers.join(", ")}
                    </Typography>
                    <Typography>Powerball: {selected.power_ball}</Typography>
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    Drag down and select a record to see details.
                  </Typography>
                )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
