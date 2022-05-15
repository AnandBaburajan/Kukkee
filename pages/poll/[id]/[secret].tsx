import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { Col, Row, Container, Jumbotron } from "react-bootstrap";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { getPoll } from "../../../src/utils/api/server";
import Layout from "../../../src/components/Layout";
import PollInfo from "../../../src/components/poll/PollInfo";
import PollTableAdmin from "../../../src/components/poll/PollTableAdmin";
import SubmitFinalTime from "../../../src/components/poll/SubmitFinalTime";
import DeletePoll from "../../../src/components/poll/DeletePoll";
import ResponseMessage from "../../../src/components/ResponseMessage";
import { Time, TimeFromDB, PollFromDB } from "../../../src/models/poll";
import { decrypt } from "../../../src/helpers";

dayjs.extend(localizedFormat);

const Poll = (props: {
  pollFromDB: PollFromDB;
  pollID: string;
  secret: string;
}): JSX.Element => {
  const { pollFromDB, pollID, secret } = props;
  const sortedTimes: TimeFromDB[] = pollFromDB.times.sort(
    (a: TimeFromDB, b: TimeFromDB) => a.start - b.start
  );
  const [finalTime, setFinalTime] = useState<Time | undefined>();
  const [response, setResponse] = useState({
    status: false,
    msg: "",
  });
  return (
    <Layout>
      <Container className="kukkee-container">
        <Row className="jumbo-row">
          <Col className="jumbo-col-black">
            <Jumbotron className="poll-info">
              <Row>
                <Col sm>
                  <DeletePoll
                    pollID={pollID}
                    secret={secret}
                    setResponse={setResponse}
                  />
                  <PollInfo poll={pollFromDB} />
                  <ShareInvite
                    pollTitle={pollFromDB.title}
                    pollID={pollID}
                    finalTime={pollFromDB.finalTime}
                  />
                </Col>
              </Row>
            </Jumbotron>
          </Col>
        </Row>
        <Row className="jumbo-row">
          <Col className="jumbo-col">
            <Jumbotron className="poll-table-jumbo" id="all-votes-table">
              <PollTableAdmin
                pollFromDB={pollFromDB}
                sortedTimes={sortedTimes}
                setFinalTime={setFinalTime}
              />
            </Jumbotron>
            {pollFromDB.open && (
              <SubmitFinalTime
                finalTime={finalTime}
                pollID={pollID}
                secret={secret}
                setResponse={setResponse}
              />
            )}
          </Col>
        </Row>
      </Container>
      <ResponseMessage response={response} setResponse={setResponse} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  let pollID = null;
  let secret = null;
  if (context.params) {
    pollID = context.params.id;
    secret = context.params.secret;
  }
  const getPollResponse = await getPoll(pollID);
  const pollFromDB = getPollResponse.data;

  if (getPollResponse.statusCode === 404) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }

  if (secret !== decrypt(pollFromDB.secret)) {
    return {
      redirect: {
        destination: `/poll/${pollID}`,
        permanent: false,
      },
    };
  }

  return {
    props: { pollFromDB, pollID, secret }, // will be passed to the page component as props
  };
};

export default Poll;